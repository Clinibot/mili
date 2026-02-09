"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { FileText, Upload, TrendingUp, TrendingDown, DollarSign, Check, Clock, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { logAdminAction } from '@/lib/logger';
import { useDashboard } from '@/components/DashboardContext';

interface Invoice {
    id: string;
    client_id: string;
    type: 'expense' | 'sale';
    amount: number;
    status: 'paid' | 'unpaid';
    document_url: string | null;
    description: string | null;
    invoice_date: string;
    created_at: string;
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const { userEmail } = useDashboard();

    // Form states for new invoice
    const [newInvoice, setNewInvoice] = useState({
        type: 'expense' as 'expense' | 'sale',
        amount: '',
        status: 'unpaid' as 'paid' | 'unpaid',
        description: '',
        file: null as File | null
    });
    const [uploading, setUploading] = useState(false);

    // Confirmation Modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<string | null>(null);

    // Date filter states
    const [filterPeriod, setFilterPeriod] = useState<'all' | '30d' | 'custom'>('all');
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    });

    useEffect(() => {
        fetchInvoices();
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, [filterPeriod, dateRange]);

    async function fetchInvoices() {
        setLoading(true);
        try {
            let query = supabase
                .from('invoices')
                .select('*')
                .order('invoice_date', { ascending: false });

            // Apply filters
            if (filterPeriod === '30d') {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                query = query.gte('invoice_date', thirtyDaysAgo.toISOString());
            } else if (filterPeriod === 'custom' && dateRange.start && dateRange.end) {
                // Ensure the end date includes the whole day
                const endTime = new Date(dateRange.end);
                endTime.setHours(23, 59, 59, 999);

                query = query
                    .gte('invoice_date', new Date(dateRange.start).toISOString())
                    .lte('invoice_date', endTime.toISOString());
            }

            const { data, error } = await query;

            if (error) {
                console.error('Supabase error fetching invoices:', error);
                throw error;
            }
            setInvoices(data || []);
        } catch (err: any) {
            console.error('Error fetching invoices:', err);
            toast.error(`Error cargando facturas: ${err.message || 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddInvoice(type: 'expense' | 'sale') {
        const amountValue = Number(newInvoice.amount);
        if (!newInvoice.amount || amountValue <= 0) {
            toast.error('Introduce una cantidad válida');
            return;
        }

        setUploading(true);
        try {
            let documentUrl = null;

            // Upload file if exists
            if (newInvoice.file) {
                console.log('Uploading file:', newInvoice.file.name, 'to bucket: documentation');
                const fileName = `${Date.now()}_${newInvoice.file.name.replace(/\s+/g, '_')}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('invoices')
                    .upload(fileName, newInvoice.file);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    throw uploadError;
                }

                console.log('Upload success:', uploadData);

                const { data } = supabase.storage
                    .from('invoices')
                    .getPublicUrl(fileName);

                documentUrl = data?.publicUrl || null;
                console.log('Generated Public URL:', documentUrl);
            }

            // Insert invoice
            const insertData = {
                type,
                amount: amountValue,
                status: newInvoice.status,
                description: newInvoice.description || null,
                document_url: documentUrl,
                invoice_date: new Date().toISOString()
            };

            console.log('Inserting invoice data:', insertData);

            const { data: savedData, error } = await supabase
                .from('invoices')
                .insert(insertData)
                .select()
                .single();

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            console.log('Invoice saved successfully:', savedData);
            if (userEmail) {
                logAdminAction(
                    userEmail,
                    'Nuevo Gasto/Venta',
                    `Se ha registrado ${type === 'expense' ? 'un gasto' : 'una venta'} de €${amountValue}`,
                    { invoiceId: savedData.id, amount: amountValue, type }
                );
            }
            toast.success(`${type === 'expense' ? 'Gasto' : 'Venta'} añadido correctamente`);

            // Reset form
            setNewInvoice({
                type,
                amount: '',
                status: 'unpaid',
                description: '',
                file: null
            });

            // Refresh list
            fetchInvoices();
        } catch (err: any) {
            console.error('Error detail adding invoice:', err);
            toast.error(`Error al guardar: ${err.message || 'Error desconocido'}`);
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(id: string) {
        setIdToDelete(id);
        setIsDeleteModalOpen(true);
    }

    async function confirmDelete() {
        if (!idToDelete) return;

        try {
            const { error } = await supabase
                .from('invoices')
                .delete()
                .eq('id', idToDelete);

            if (error) throw error;
            if (userEmail) {
                logAdminAction(userEmail, 'Eliminar Factura', `Se ha eliminado una factura (ID: ${idToDelete.substring(0, 8)}...)`);
            }
            toast.success('Eliminado correctamente');
            fetchInvoices();
        } catch (err) {
            console.error('Error deleting invoice:', err);
            toast.error('Error al eliminar');
        } finally {
            setIsDeleteModalOpen(false);
            setIdToDelete(null);
        }
    }

    async function handleToggleStatus(id: string, currentStatus: string) {
        const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
        try {
            const { error } = await supabase
                .from('invoices')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            toast.success(`Estado actualizado a ${newStatus === 'paid' ? 'Pagado' : 'Pendiente'}`);
            fetchInvoices();
        } catch (err) {
            console.error('Error updating status:', err);
            toast.error('Error al actualizar estado');
        }
    }

    const expenses = invoices.filter(inv => inv.type === 'expense');
    const sales = invoices.filter(inv => inv.type === 'sale');

    const totalExpenses = expenses.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalSales = sales.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const balance = totalSales - totalExpenses;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Gestión de Facturas</h1>
                        <p className="text-slate-500 mt-1">Control de gastos y ventas</p>
                    </div>

                    {/* Date Filters */}
                    <div className="flex flex-wrap items-center gap-2 bg-white/50 p-1.5 rounded-2xl border border-slate-200/60 backdrop-blur-sm">
                        <button
                            onClick={() => setFilterPeriod('all')}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${filterPeriod === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Todo
                        </button>
                        <button
                            onClick={() => setFilterPeriod('30d')}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${filterPeriod === '30d' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Últimos 30 días
                        </button>
                        <button
                            onClick={() => setFilterPeriod('custom')}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${filterPeriod === 'custom' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Personalizado
                        </button>

                        {filterPeriod === 'custom' && (
                            <div className="flex items-center gap-2 px-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400"
                                />
                                <span className="text-slate-300">→</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Balance Card */}
                <Card className={`border-2 ${balance >= 0 ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-red-200 bg-gradient-to-br from-red-50 to-orange-50'} shadow-lg rounded-3xl overflow-hidden`}>
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">Balance Total</p>
                                <h2 className={`text-5xl font-black ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    €{balance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="text-center p-4 bg-white/60 rounded-2xl backdrop-blur-sm">
                                    <div className="flex items-center gap-2 justify-center mb-1">
                                        <TrendingUp className="text-green-600" size={16} />
                                        <p className="text-xs font-bold text-slate-600">Ventas</p>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600">€{totalSales.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="text-center p-4 bg-white/60 rounded-2xl backdrop-blur-sm">
                                    <div className="flex items-center gap-2 justify-center mb-1">
                                        <TrendingDown className="text-red-600" size={16} />
                                        <p className="text-xs font-bold text-slate-600">Gastos</p>
                                    </div>
                                    <p className="text-2xl font-bold text-red-600">€{totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Two Columns: Expenses and Sales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* GASTOS Column */}
                    <InvoiceColumn
                        title="Gastos"
                        type="expense"
                        icon={<TrendingDown className="text-red-600" size={20} />}
                        color="red"
                        invoices={expenses}
                        total={totalExpenses}
                        newInvoice={newInvoice}
                        setNewInvoice={setNewInvoice}
                        onAdd={() => handleAddInvoice('expense')}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                        uploading={uploading}
                        loading={loading}
                    />

                    {/* VENTAS Column */}
                    <InvoiceColumn
                        title="Ventas"
                        type="sale"
                        icon={<TrendingUp className="text-green-600" size={20} />}
                        color="green"
                        invoices={sales}
                        total={totalSales}
                        newInvoice={newInvoice}
                        setNewInvoice={setNewInvoice}
                        onAdd={() => handleAddInvoice('sale')}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                        uploading={uploading}
                        loading={loading}
                    />
                </div>

                {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-slate-100 animate-in zoom-in-95 duration-200">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-6">
                                    <AlertTriangle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">¿Estás seguro?</h3>
                                <p className="text-slate-500 mb-8">
                                    Esta acción eliminará el registro de forma permanente. No podrás deshacerlo.
                                </p>
                                <div className="flex w-full gap-3">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="flex-1 px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 px-6 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-200"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

// Invoice Column Component
function InvoiceColumn({
    title,
    type,
    icon,
    color,
    invoices,
    total,
    newInvoice,
    setNewInvoice,
    onAdd,
    onDelete,
    onToggleStatus,
    uploading,
    loading
}: {
    title: string;
    type: 'expense' | 'sale';
    icon: React.ReactNode;
    color: 'red' | 'green';
    invoices: Invoice[];
    total: number;
    newInvoice: any;
    setNewInvoice: any;
    onAdd: () => void;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string, status: string) => void;
    uploading: boolean;
    loading: boolean;
}) {
    const bgColor = color === 'red' ? 'bg-red-50' : 'bg-green-50';
    const borderColor = color === 'red' ? 'border-red-200' : 'border-green-200';
    const textColor = color === 'red' ? 'text-red-600' : 'text-green-600';

    return (
        <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className={`${bgColor} border-b ${borderColor}`}>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                        {icon}
                        {title}
                    </CardTitle>
                    <div className="text-right">
                        <p className="text-xs font-medium text-slate-500">Total</p>
                        <p className={`text-2xl font-black ${textColor}`}>
                            €{total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {/* Add Form */}
                <div className={`space-y-3 p-4 ${bgColor} border ${borderColor} rounded-2xl`}>
                    <h4 className="font-bold text-sm text-slate-700">Añadir {title}</h4>

                    {/* File Upload */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Documento (opcional)</label>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setNewInvoice({ ...newInvoice, type, file: e.target.files?.[0] || null })}
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad (€)</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={newInvoice.type === type ? newInvoice.amount : ''}
                            onChange={(e) => setNewInvoice({ ...newInvoice, type, amount: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
                        <select
                            value={newInvoice.type === type ? newInvoice.status : 'unpaid'}
                            onChange={(e) => setNewInvoice({ ...newInvoice, type, status: e.target.value as 'paid' | 'unpaid' })}
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="unpaid">No Pagado</option>
                            <option value="paid">Pagado</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Descripción (opcional)</label>
                        <textarea
                            placeholder="Detalles..."
                            value={newInvoice.type === type ? newInvoice.description : ''}
                            onChange={(e) => setNewInvoice({ ...newInvoice, type, description: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                            rows={2}
                        />
                    </div>

                    <button
                        onClick={onAdd}
                        disabled={uploading}
                        className={`w-full ${color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50`}
                    >
                        <Upload size={16} />
                        {uploading ? 'Guardando...' : `Añadir ${title}`}
                    </button>
                </div>

                {/* Invoice List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-8 text-slate-400 text-sm">Cargando...</div>
                    ) : invoices.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">No hay {title.toLowerCase()} registrados</div>
                    ) : (
                        invoices.map((invoice) => (
                            <InvoiceCard
                                key={invoice.id}
                                invoice={invoice}
                                onDelete={onDelete}
                                onToggleStatus={onToggleStatus}
                                color={color}
                            />
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Invoice Card Component
function InvoiceCard({
    invoice,
    onDelete,
    onToggleStatus,
    color
}: {
    invoice: Invoice;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string, status: string) => void;
    color: 'red' | 'green';
}) {
    return (
        <div className="p-3 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <p className={`text-lg font-bold ${color === 'red' ? 'text-red-600' : 'text-green-600'}`}>
                            €{Number(invoice.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </p>
                        <button
                            onClick={() => onToggleStatus(invoice.id, invoice.status)}
                            className="cursor-pointer transition-transform hover:scale-105"
                        >
                            {invoice.status === 'paid' ? (
                                <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
                                    <Check size={12} strokeWidth={3} />
                                    Pagado
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                                    <Clock size={12} strokeWidth={3} />
                                    No Pagado
                                </span>
                            )}
                        </button>
                    </div>
                    {invoice.description && (
                        <p className="text-sm text-slate-700 font-medium mb-1">{invoice.description}</p>
                    )}
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {format(new Date(invoice.invoice_date), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    {invoice.document_url && (
                        <a
                            href={invoice.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                            title="Ver documento"
                        >
                            <FileText size={16} />
                        </a>
                    )}
                    <button
                        onClick={() => onDelete(invoice.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 opacity-60 hover:opacity-100"
                        title="Eliminar"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
