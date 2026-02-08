"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { FileText, Upload, TrendingUp, TrendingDown, DollarSign, Check, Clock, X } from 'lucide-react';
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

    // Form states for new invoice
    const [newInvoice, setNewInvoice] = useState({
        type: 'expense' as 'expense' | 'sale',
        amount: '',
        status: 'unpaid' as 'paid' | 'unpaid',
        description: '',
        file: null as File | null
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchInvoices();
    }, []);

    async function fetchInvoices() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .order('invoice_date', { ascending: false });

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
        if (!newInvoice.amount || Number(newInvoice.amount) <= 0) {
            toast.error('Introduce una cantidad válida');
            return;
        }

        setUploading(true);
        try {
            let documentUrl = null;

            // Upload file if exists
            if (newInvoice.file) {
                const fileName = `${Date.now()}_${newInvoice.file.name}`;
                const { data, error: uploadError } = await supabase.storage
                    .from('invoices')
                    .upload(fileName, newInvoice.file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('invoices')
                    .getPublicUrl(fileName);

                documentUrl = publicUrl;
            }

            // Insert invoice
            const { error } = await supabase
                .from('invoices')
                .insert({
                    type,
                    amount: Number(newInvoice.amount),
                    status: newInvoice.status,
                    description: newInvoice.description || null,
                    document_url: documentUrl,
                    invoice_date: new Date().toISOString()
                });

            if (error) {
                console.error('Supabase error adding invoice:', error);
                throw error;
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
            console.error('Error adding invoice:', err);
            toast.error(`Error al guardar: ${err.message || 'Error desconocido'}`);
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(id: string) {
        try {
            const { error } = await supabase
                .from('invoices')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Eliminado correctamente');
            fetchInvoices();
        } catch (err) {
            console.error('Error deleting invoice:', err);
            toast.error('Error al eliminar');
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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Gestión de Facturas</h1>
                        <p className="text-slate-500 mt-1">Control de gastos y ventas</p>
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
                        uploading={uploading}
                        loading={loading}
                    />
                </div>
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
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-8 text-slate-400">Cargando...</div>
                    ) : invoices.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            No hay {title.toLowerCase()} registrados
                        </div>
                    ) : (
                        invoices.map(invoice => (
                            <InvoiceCard
                                key={invoice.id}
                                invoice={invoice}
                                onDelete={onDelete}
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
    color
}: {
    invoice: Invoice;
    onDelete: (id: string) => void;
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
                        {invoice.status === 'paid' ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                <Check size={12} />
                                Pagado
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                <Clock size={12} />
                                Pendiente
                            </span>
                        )}
                    </div>
                    {invoice.description && (
                        <p className="text-sm text-slate-600 mb-1">{invoice.description}</p>
                    )}
                    <p className="text-xs text-slate-400">
                        {format(new Date(invoice.invoice_date), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {invoice.document_url && (
                        <a
                            href={invoice.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver documento"
                        >
                            <FileText size={18} />
                        </a>
                    )}
                    <button
                        onClick={() => onDelete(invoice.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
