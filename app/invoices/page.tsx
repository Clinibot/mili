"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { FileText, Upload, TrendingUp, TrendingDown, DollarSign, Check, Clock, X, AlertTriangle, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
    const [userEmail, setUserEmail] = useState<string>('');

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

    // Editing state
    const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

    // Date filter states
    const [filterPeriod, setFilterPeriod] = useState<'all' | '30d' | 'custom'>('all');
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    });

    useEffect(() => {
        fetchUserEmail();
        fetchInvoices();
    }, []);

    const fetchUserEmail = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) setUserEmail(session.user.email);
    };

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
            let documentUrl = editingInvoiceId
                ? invoices.find(inv => inv.id === editingInvoiceId)?.document_url || null
                : null;

            // Upload file if exists
            if (newInvoice.file) {
                console.log('Uploading file:', newInvoice.file.name, 'to bucket: invoices');
                const fileName = `${Date.now()}_${newInvoice.file.name.replace(/\s+/g, '_')}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('invoices')
                    .upload(fileName, newInvoice.file);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    throw uploadError;
                }

                const { data } = supabase.storage
                    .from('invoices')
                    .getPublicUrl(fileName);

                documentUrl = data?.publicUrl || null;
            }

            if (editingInvoiceId) {
                // Update existing invoice
                const { error } = await supabase
                    .from('invoices')
                    .update({
                        amount: amountValue,
                        status: newInvoice.status,
                        description: newInvoice.description || null,
                        document_url: documentUrl,
                    })
                    .eq('id', editingInvoiceId);

                if (error) throw error;
                toast.success(`${type === 'expense' ? 'Gasto' : 'Venta'} actualizado correctamente`);
            } else {
                // Insert new invoice
                const { error } = await supabase
                    .from('invoices')
                    .insert({
                        type,
                        amount: amountValue,
                        status: newInvoice.status,
                        description: newInvoice.description || null,
                        document_url: documentUrl,
                        invoice_date: new Date().toISOString()
                    });

                if (error) throw error;
                toast.success(`${type === 'expense' ? 'Gasto' : 'Venta'} añadido correctamente`);
            }

            // Reset form and state
            setNewInvoice({
                type,
                amount: '',
                status: 'unpaid',
                description: '',
                file: null
            });
            setEditingInvoiceId(null);

            // Refresh list
            fetchInvoices();
        } catch (err: any) {
            console.error('Error handling invoice:', err);
            toast.error(`Error: ${err.message || 'Error desconocido'}`);
        } finally {
            setUploading(false);
        }
    }

    const startEditing = (invoice: Invoice) => {
        setEditingInvoiceId(invoice.id);
        setNewInvoice({
            type: invoice.type,
            amount: String(invoice.amount),
            status: invoice.status,
            description: invoice.description || '',
            file: null
        });

        // Scroll to form (optional UX)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditing = () => {
        setEditingInvoiceId(null);
        setNewInvoice({
            type: 'expense',
            amount: '',
            status: 'unpaid',
            description: '',
            file: null
        });
    };

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
                        <h1 className="text-3xl font-bold text-[#E8ECF1]">Gestión de Facturas</h1>
                        <p className="text-[rgba(255,255,255,0.55)] mt-1">Control de gastos y ventas</p>
                    </div>

                    {/* Date Filters */}
                    <div className="flex flex-wrap items-center gap-2 bg-[#141A23] p-1.5 rounded-2xl border border-[#1F2937]">
                        <button
                            onClick={() => setFilterPeriod('all')}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${filterPeriod === 'all' ? 'bg-[#008DCB]/10 text-[#008DCB] shadow-sm' : 'text-[rgba(255,255,255,0.55)] hover:text-[#E8ECF1]'}`}
                        >
                            Todo
                        </button>
                        <button
                            onClick={() => setFilterPeriod('30d')}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${filterPeriod === '30d' ? 'bg-[#008DCB]/10 text-[#008DCB] shadow-sm' : 'text-[rgba(255,255,255,0.55)] hover:text-[#E8ECF1]'}`}
                        >
                            Últimos 30 días
                        </button>
                        <button
                            onClick={() => setFilterPeriod('custom')}
                            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${filterPeriod === 'custom' ? 'bg-[#008DCB]/10 text-[#008DCB] shadow-sm' : 'text-[rgba(255,255,255,0.55)] hover:text-[#E8ECF1]'}`}
                        >
                            Personalizado
                        </button>

                        {filterPeriod === 'custom' && (
                            <div className="flex items-center gap-2 px-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="text-xs bg-[#0E1219] border border-[#1F2937] text-[#E8ECF1] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#008DCB]"
                                />
                                <span className="text-[rgba(255,255,255,0.3)]">→</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="text-xs bg-[#0E1219] border border-[#1F2937] text-[#E8ECF1] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#008DCB]"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Balance Card */}
                <Card className={`border ${balance >= 0 ? 'border-[#22C55E]/20 bg-gradient-to-br from-[#22C55E]/10 to-[#22C55E]/5' : 'border-[#EF4444]/20 bg-gradient-to-br from-[#EF4444]/10 to-[#EF4444]/5'} shadow-lg rounded-3xl overflow-hidden`}>
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-[rgba(255,255,255,0.55)] uppercase tracking-wider mb-2">Balance Total</p>
                                <h2 className={`text-5xl font-black ${balance >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                                    €{balance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="text-center p-4 bg-[#0E1219]/60 rounded-2xl backdrop-blur-sm border border-[#1F2937]">
                                    <div className="flex items-center gap-2 justify-center mb-1">
                                        <TrendingUp className="text-[#22C55E]" size={16} />
                                        <p className="text-xs font-bold text-[#E8ECF1]">Ventas</p>
                                    </div>
                                    <p className="text-2xl font-bold text-[#22C55E]">€{totalSales.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="text-center p-4 bg-[#0E1219]/60 rounded-2xl backdrop-blur-sm border border-[#1F2937]">
                                    <div className="flex items-center gap-2 justify-center mb-1">
                                        <TrendingDown className="text-[#EF4444]" size={16} />
                                        <p className="text-xs font-bold text-[#E8ECF1]">Gastos</p>
                                    </div>
                                    <p className="text-2xl font-bold text-[#EF4444]">€{totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
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
                        icon={<TrendingDown className="text-[#EF4444]" size={20} />}
                        color="red"
                        invoices={expenses}
                        total={totalExpenses}
                        newInvoice={newInvoice}
                        setNewInvoice={setNewInvoice}
                        onAdd={() => handleAddInvoice('expense')}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                        onEdit={startEditing}
                        onCancelEdit={cancelEditing}
                        editingId={editingInvoiceId}
                        uploading={uploading}
                        loading={loading}
                    />

                    {/* VENTAS Column */}
                    <InvoiceColumn
                        title="Ventas"
                        type="sale"
                        icon={<TrendingUp className="text-[#22C55E]" size={20} />}
                        color="green"
                        invoices={sales}
                        total={totalSales}
                        newInvoice={newInvoice}
                        setNewInvoice={setNewInvoice}
                        onAdd={() => handleAddInvoice('sale')}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                        onEdit={startEditing}
                        onCancelEdit={cancelEditing}
                        editingId={editingInvoiceId}
                        uploading={uploading}
                        loading={loading}
                    />
                </div>

                {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-[#0E1219] rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-[#1F2937] animate-in zoom-in-95 duration-200">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-[#EF4444]/10 rounded-2xl flex items-center justify-center text-[#EF4444] mb-6">
                                    <AlertTriangle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-[#E8ECF1] mb-2">¿Estás seguro?</h3>
                                <p className="text-[rgba(255,255,255,0.55)] mb-8">
                                    Esta acción eliminará el registro de forma permanente. No podrás deshacerlo.
                                </p>
                                <div className="flex w-full gap-3">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="flex-1 px-6 py-3 text-sm font-bold text-[#E8ECF1] bg-[#1F2937] hover:bg-[#374151] rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 px-6 py-3 text-sm font-bold text-white bg-[#EF4444] hover:bg-[#EF4444]/80 rounded-xl transition-colors shadow-lg shadow-red-900/20"
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
    onEdit: (invoice: Invoice) => void;
    onCancelEdit: () => void;
    editingId: string | null;
    uploading: boolean;
    loading: boolean;
}) {
    // Determine colors based on type
    const isRed = color === 'red';
    const bgColor = isRed ? 'bg-[#EF4444]/5' : 'bg-[#22C55E]/5';
    const borderColor = isRed ? 'border-[#EF4444]/20' : 'border-[#22C55E]/20';
    const textColor = isRed ? 'text-[#EF4444]' : 'text-[#22C55E]';
    const buttonBg = isRed ? 'bg-[#EF4444] hover:bg-[#EF4444]/80' : 'bg-[#22C55E] hover:bg-[#22C55E]/80';

    return (
        <Card className="bg-[#141A23] border-[#1F2937] shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className={`${bgColor} border-b ${borderColor}`}>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-[#E8ECF1]">
                        {icon}
                        {title}
                    </CardTitle>
                    <div className="text-right">
                        <p className="text-xs font-medium text-[rgba(255,255,255,0.55)]">Total</p>
                        <p className={`text-2xl font-black ${textColor}`}>
                            €{total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {/* Add Form */}
                <div className={`space-y-3 p-4 ${bgColor} border ${borderColor} rounded-2xl`}>
                    <h4 className="font-bold text-sm text-[#E8ECF1]">
                        {editingId && invoices.find(inv => inv.id === editingId)?.type === type ? `Editar ${title}` : `Añadir ${title}`}
                    </h4>

                    {/* File Upload */}
                    <div>
                        <label className="block text-xs font-medium text-[rgba(255,255,255,0.55)] mb-1">Documento (opcional)</label>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setNewInvoice({ ...newInvoice, type, file: e.target.files?.[0] || null })}
                                className="w-full text-sm text-[rgba(255,255,255,0.4)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0E1219] file:text-[#E8ECF1] hover:file:bg-[#1F2937] cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-xs font-medium text-[rgba(255,255,255,0.55)] mb-1">Cantidad (€)</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={newInvoice.type === type ? newInvoice.amount : ''}
                            onChange={(e) => setNewInvoice({ ...newInvoice, type, amount: e.target.value })}
                            className="w-full bg-[#0E1219] border border-[#1F2937] rounded-lg py-2 px-3 text-[#E8ECF1] focus:outline-none focus:border-[#008DCB] focus:ring-1 focus:ring-[#008DCB]/20 placeholder:text-[rgba(255,255,255,0.3)]"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-medium text-[rgba(255,255,255,0.55)] mb-1">Estado</label>
                        <select
                            value={newInvoice.type === type ? newInvoice.status : 'unpaid'}
                            onChange={(e) => setNewInvoice({ ...newInvoice, type, status: e.target.value as 'paid' | 'unpaid' })}
                            className="w-full bg-[#0E1219] border border-[#1F2937] rounded-lg py-2 px-3 text-[#E8ECF1] focus:outline-none focus:border-[#008DCB] focus:ring-1 focus:ring-[#008DCB]/20"
                        >
                            <option value="unpaid">No Pagado</option>
                            <option value="paid">Pagado</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium text-[rgba(255,255,255,0.55)] mb-1">Descripción (opcional)</label>
                        <textarea
                            placeholder="Detalles..."
                            value={newInvoice.type === type ? newInvoice.description : ''}
                            onChange={(e) => setNewInvoice({ ...newInvoice, type, description: e.target.value })}
                            className="w-full bg-[#0E1219] border border-[#1F2937] rounded-lg py-2 px-3 text-[#E8ECF1] focus:outline-none focus:border-[#008DCB] focus:ring-1 focus:ring-[#008DCB]/20 placeholder:text-[rgba(255,255,255,0.3)] resize-none"
                            rows={2}
                        />
                    </div>

                    <div className="flex gap-2">
                        {editingId && invoices.find(inv => inv.id === editingId)?.type === type && (
                            <button
                                onClick={onCancelEdit}
                                className="flex-1 bg-[#1F2937] hover:bg-[#374151] text-[#E8ECF1] py-2.5 px-4 rounded-xl font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            onClick={onAdd}
                            disabled={uploading}
                            className={`flex-[2] ${buttonBg} text-white py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50`}
                        >
                            <Upload size={16} />
                            {uploading ? 'Guardando...' : (editingId && invoices.find(inv => inv.id === editingId)?.type === type ? `Guardar Cambios` : `Añadir ${title}`)}
                        </button>
                    </div>
                </div>

                {/* Invoice List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-8 text-[rgba(255,255,255,0.3)] text-sm">Cargando...</div>
                    ) : invoices.length === 0 ? (
                        <div className="text-center py-8 text-[rgba(255,255,255,0.3)] text-sm">No hay {title.toLowerCase()} registrados</div>
                    ) : (
                        invoices.map((invoice) => (
                            <InvoiceCard
                                key={invoice.id}
                                invoice={invoice}
                                onDelete={onDelete}
                                onToggleStatus={onToggleStatus}
                                onEdit={onEdit}
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
    onEdit: (invoice: Invoice) => void;
    color: 'red' | 'green';
}) {
    const isRed = color === 'red';
    const amountColor = isRed ? 'text-[#EF4444]' : 'text-[#22C55E]';

    return (
        <div className="p-3 bg-[#0E1219] border border-[#1F2937] rounded-xl hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <p className={`text-lg font-bold ${amountColor}`}>
                            €{Number(invoice.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </p>
                        <button
                            onClick={() => onToggleStatus(invoice.id, invoice.status)}
                            className="cursor-pointer transition-transform hover:scale-105"
                        >
                            {invoice.status === 'paid' ? (
                                <span className="flex items-center gap-1 text-xs font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-0.5 rounded-full">
                                    <Check size={12} strokeWidth={3} />
                                    Pagado
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs font-bold text-[#F78E5E] bg-[#F78E5E]/10 border border-[#F78E5E]/20 px-2 py-0.5 rounded-full">
                                    <Clock size={12} strokeWidth={3} />
                                    No Pagado
                                </span>
                            )}
                        </button>
                    </div>
                    {invoice.description && (
                        <p className="text-sm text-[#E8ECF1] font-medium mb-1">{invoice.description}</p>
                    )}
                    <p className="text-[10px] text-[rgba(255,255,255,0.4)] font-bold uppercase tracking-wider">
                        {format(new Date(invoice.invoice_date), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    {invoice.document_url && (
                        <a
                            href={invoice.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-[#008DCB] hover:bg-[#008DCB]/10 rounded-lg transition-colors border border-transparent hover:border-[#008DCB]/20"
                            title="Ver documento"
                        >
                            <FileText size={16} />
                        </a>
                    )}
                    <button
                        onClick={() => onEdit(invoice)}
                        className="p-1.5 text-[#008DCB] hover:bg-[#008DCB]/10 rounded-lg transition-colors border border-transparent hover:border-[#008DCB]/20"
                        title="Editar"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(invoice.id)}
                        className="p-1.5 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors border border-transparent hover:border-[#EF4444]/20 opacity-60 hover:opacity-100"
                        title="Eliminar"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
