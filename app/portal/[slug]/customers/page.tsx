"use client";

import { useEffect, useState, useMemo } from 'react';
import { usePortal } from '../PortalContext';
import { supabase } from '@/lib/supabaseClient';
import {
    Search, Download, Phone, Columns, Check, X, Table, RefreshCw,
    ChevronRight, Clock, Mic, FileText, Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Represents a single grouped customer (by phone number)
interface GroupedCustomer {
    phone: string;
    name: string | null;
    callCount: number;
    lastCallDate: string;
    totalDuration: number;
    latestCustomData: Record<string, any>;
    calls: any[]; // All original call records for this phone
}

export default function CustomersPage() {
    const { client: portalClient, slug: portalSlug } = usePortal();
    const [calls, setCalls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleColumns, setVisibleColumns] = useState<string[]>(['telefono', 'nombre', 'llamadas', 'ultima_llamada']);
    const [availableAIFields, setAvailableAIFields] = useState<string[]>([]);
    const [showColumnPicker, setShowColumnPicker] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<GroupedCustomer | null>(null);

    useEffect(() => {
        if (!portalClient?.id) return;
        fetchData(portalClient.id);
    }, [portalClient?.id]);

    async function fetchData(clientId: string) {
        try {
            setLoading(true);

            const { data: callsData, error: callsError } = await supabase
                .from('calls')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (callsError) throw callsError;
            setCalls(callsData || []);

            const { data: configData } = await supabase
                .from('client_analytics_configs')
                .select('data_field, name')
                .eq('client_id', clientId);

            const aiFieldsMap = new Map<string, string>();
            configData?.forEach(cfg => {
                if (cfg.data_field) aiFieldsMap.set(cfg.data_field.toLowerCase(), cfg.data_field);
            });
            callsData?.forEach(call => {
                const customData = typeof call.custom_analysis_data === 'string'
                    ? JSON.parse(call.custom_analysis_data || '{}')
                    : (call.custom_analysis_data || {});
                Object.keys(customData).forEach(key => {
                    const lower = key.toLowerCase();
                    if (!aiFieldsMap.has(lower)) aiFieldsMap.set(lower, key);
                });
            });

            const excluded = ['fecha', 'telefono', 'nombre', 'duracion', 'llamadas', 'ultima_llamada'];
            const fields = Array.from(aiFieldsMap.values()).filter(f => !excluded.includes(f.toLowerCase()));
            setAvailableAIFields(fields);

            if (fields.length > 0 && visibleColumns.length <= 4) {
                const topFields = fields.slice(0, 2);
                setVisibleColumns(prev => Array.from(new Set([...prev, ...topFields])));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    }

    const getCustomerName = (customData: any): string | null => {
        if (!customData) return null;
        const data = typeof customData === 'string' ? JSON.parse(customData || '{}') : customData;
        const nameKeys = ['nombre', 'Nombre', 'nombre_cliente', 'usuario', 'User', 'Name', 'full_name'];
        for (const key of nameKeys) {
            if (data[key] && String(data[key]).trim() !== '') return String(data[key]);
        }
        const fuzzyKey = Object.keys(data).find(k =>
            k.toLowerCase().includes('nombre') || k.toLowerCase().includes('name')
        );
        if (fuzzyKey) return String(data[fuzzyKey]);
        return null;
    };

    const parseCustomData = (raw: any): Record<string, any> => {
        if (!raw) return {};
        return typeof raw === 'string' ? JSON.parse(raw || '{}') : raw;
    };

    // Group calls by phone number
    const groupedCustomers = useMemo((): GroupedCustomer[] => {
        const map = new Map<string, GroupedCustomer>();

        calls.forEach(call => {
            const phone = call.from_number || call.to_number || 'Sin número';
            const customData = parseCustomData(call.custom_analysis_data);

            if (!map.has(phone)) {
                map.set(phone, {
                    phone,
                    name: getCustomerName(call.custom_analysis_data),
                    callCount: 0,
                    lastCallDate: call.created_at,
                    totalDuration: 0,
                    latestCustomData: customData,
                    calls: [],
                });
            }

            const group = map.get(phone)!;
            group.callCount++;
            group.totalDuration += (call.duration_seconds || 0);
            group.calls.push(call);

            // Use data from the most recent call (calls are sorted desc)
            if (group.calls.length === 1) {
                group.latestCustomData = customData;
                group.name = getCustomerName(call.custom_analysis_data) || group.name;
            }
        });

        return Array.from(map.values());
    }, [calls]);

    // Filter grouped customers
    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return groupedCustomers;
        const search = searchTerm.toLowerCase();
        return groupedCustomers.filter(customer => {
            const phoneMatch = customer.phone.toLowerCase().includes(search);
            const nameMatch = customer.name?.toLowerCase().includes(search);
            const dataMatch = JSON.stringify(customer.latestCustomData).toLowerCase().includes(search);
            return phoneMatch || nameMatch || dataMatch;
        });
    }, [groupedCustomers, searchTerm]);

    const exportToCSV = () => {
        if (filteredCustomers.length === 0) return;
        const headers = visibleColumns.map(col => {
            if (col === 'telefono') return 'Teléfono';
            if (col === 'nombre') return 'Nombre';
            if (col === 'llamadas') return 'Nº Llamadas';
            if (col === 'ultima_llamada') return 'Última Llamada';
            return col;
        });

        const rows = filteredCustomers.map(customer => {
            return visibleColumns.map(col => {
                if (col === 'telefono') return customer.phone;
                if (col === 'nombre') return customer.name || 'N/A';
                if (col === 'llamadas') return String(customer.callCount);
                if (col === 'ultima_llamada') return format(new Date(customer.lastCallDate), 'dd/MM/yyyy HH:mm');
                const val = customer.latestCustomData[col];
                if (val !== undefined && val !== null) return String(val);
                const lowerCol = col.toLowerCase();
                const actualKey = Object.keys(customer.latestCustomData).find(k => k.toLowerCase() === lowerCol);
                return actualKey ? String(customer.latestCustomData[actualKey]) : '';
            });
        });

        const csvContent = "\uFEFF" + [
            headers.join(','),
            ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `clientes_${portalSlug}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleColumn = (col: string) => {
        setVisibleColumns(prev =>
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
        );
    };

    const allColumns = ['telefono', 'nombre', 'llamadas', 'ultima_llamada', ...availableAIFields];

    const getColumnLabel = (col: string) => {
        if (col === 'telefono') return 'Teléfono';
        if (col === 'nombre') return 'Nombre';
        if (col === 'llamadas') return 'Llamadas';
        if (col === 'ultima_llamada') return 'Última Llamada';
        return col.replace(/_/g, ' ');
    };

    return (
        <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-black text-[#E8ECF1] tracking-tight mb-2">
                        Listado de Clientes
                    </h1>
                    <p className="text-[rgba(255,255,255,0.45)] text-sm font-medium">
                        Contactos agrupados por teléfono. Haz clic en un cliente para ver su historial.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchData(portalClient?.id || '')}
                        disabled={loading}
                        className="flex items-center gap-2 bg-[#0E1219] text-[#E8ECF1] px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#141A23] transition-all border border-[#1F2937] disabled:opacity-50"
                        title="Refrescar datos"
                    >
                        <RefreshCw size={18} className={cn(loading && "animate-spin")} />
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 bg-[#008DCB]/10 text-[#008DCB] px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#008DCB]/20 transition-all active:scale-95 border border-[#008DCB]/20"
                    >
                        <Download size={18} />
                        Exportar CSV
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowColumnPicker(!showColumnPicker)}
                            className="flex items-center gap-2 bg-[#0E1219] text-[#E8ECF1] px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#141A23] transition-all border border-[#1F2937]"
                        >
                            <Columns size={18} />
                            Columnas
                        </button>
                        {showColumnPicker && (
                            <div className="absolute right-0 mt-2 w-64 bg-[#0E1219] border border-[#1F2937] rounded-2xl shadow-2xl z-50 p-4 animate-in zoom-in-95 duration-200">
                                <h4 className="text-[10px] font-black text-[#4B5563] uppercase tracking-widest mb-3">Visibilidad de Columnas</h4>
                                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {allColumns.map(col => (
                                        <button
                                            key={col}
                                            onClick={() => toggleColumn(col)}
                                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#141A23] transition-colors group"
                                        >
                                            <span className="text-xs font-bold text-[#E8ECF1] capitalize">{getColumnLabel(col)}</span>
                                            {visibleColumns.includes(col) ? (
                                                <Check size={14} className="text-[#008DCB]" />
                                            ) : (
                                                <div className="w-3.5 h-3.5 border border-[#1F2937] rounded" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#0E1219] border border-[#1F2937] rounded-3xl overflow-hidden shadow-2xl shadow-black/40">
                <div className="p-6 border-b border-[#1F2937] bg-[#0E1219]/50 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B5563] group-focus-within:text-[#008DCB] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por teléfono o nombre..."
                            className="w-full bg-[#141A23] border border-[#1F2937] rounded-2xl py-3 pl-12 pr-4 text-sm text-[#E8ECF1] placeholder:text-[#4B5563] outline-none focus:border-[#008DCB]/50 focus:ring-4 focus:ring-[#008DCB]/10 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#4B5563] bg-[#141A23] px-3 py-1.5 rounded-lg border border-[#1F2937]">
                            {filteredCustomers.length} clientes
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#141A23]/30">
                                {visibleColumns.map(col => (
                                    <th key={col} className="px-6 py-4 text-[10px] font-black text-[#4B5563] uppercase tracking-widest border-b border-[#1F2937]">
                                        {getColumnLabel(col)}
                                    </th>
                                ))}
                                <th className="px-4 py-4 border-b border-[#1F2937] w-10" />
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {visibleColumns.map(c => (
                                            <td key={c} className="px-6 py-6 border-b border-[#1F2937]/50">
                                                <div className="h-4 bg-[#141A23] rounded-lg w-full opacity-50" />
                                            </td>
                                        ))}
                                        <td className="px-4 py-6 border-b border-[#1F2937]/50" />
                                    </tr>
                                ))
                            ) : filteredCustomers.length > 0 ? (
                                filteredCustomers.map((customer) => (
                                    <tr
                                        key={customer.phone}
                                        onClick={() => setSelectedCustomer(customer)}
                                        className="hover:bg-[#141A23]/40 transition-colors group border-b border-[#1F2937]/30 cursor-pointer"
                                    >
                                        {visibleColumns.map(col => (
                                            <td key={col} className="px-6 py-5">
                                                {col === 'telefono' ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg bg-[#008DCB]/10 flex items-center justify-center text-[#008DCB]">
                                                            <Phone size={12} />
                                                        </div>
                                                        <span className="text-sm font-bold text-[#E8ECF1] tabular-nums">
                                                            {customer.phone}
                                                        </span>
                                                    </div>
                                                ) : col === 'nombre' ? (
                                                    <span className="text-sm font-medium text-[#E8ECF1]">
                                                        {customer.name || <span className="text-[#4B5563]/60 italic">No detectado</span>}
                                                    </span>
                                                ) : col === 'llamadas' ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-[#008DCB] bg-[#008DCB]/10 px-2.5 py-1 rounded-lg border border-[#008DCB]/20">
                                                            {customer.callCount}
                                                        </span>
                                                    </div>
                                                ) : col === 'ultima_llamada' ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-[#E8ECF1] tabular-nums">
                                                            {format(new Date(customer.lastCallDate), 'dd/MM/yyyy')}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-[#4B5563] tabular-nums uppercase">
                                                            {format(new Date(customer.lastCallDate), 'HH:mm')}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-medium text-[rgba(255,255,255,0.7)] line-clamp-2">
                                                        {(() => {
                                                            const val = customer.latestCustomData[col];
                                                            if (val !== undefined && val !== null) return String(val);
                                                            const lowerCol = col.toLowerCase();
                                                            const actualKey = Object.keys(customer.latestCustomData).find(k => k.toLowerCase() === lowerCol);
                                                            return actualKey ? String(customer.latestCustomData[actualKey]) : '-';
                                                        })()}
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-4 py-5">
                                            <ChevronRight size={16} className="text-[#4B5563] group-hover:text-[#008DCB] transition-colors" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={visibleColumns.length + 1} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-[#141A23] rounded-full text-[#4B5563]">
                                                <Table size={32} />
                                            </div>
                                            <p className="text-[#4B5563] font-bold text-sm uppercase tracking-widest">No se encontraron clientes</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Call History Drawer */}
            {selectedCustomer && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                        onClick={() => setSelectedCustomer(null)}
                    />

                    {/* Drawer Panel */}
                    <div className="fixed top-0 right-0 h-screen w-full max-w-lg bg-[#0E1219] border-l border-[#1F2937] z-50 shadow-2xl shadow-black/50 animate-in slide-in-from-right duration-300 flex flex-col">
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-[#1F2937] bg-[#0E1219]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-black text-[#E8ECF1] tracking-tight">Historial del Cliente</h3>
                                <button
                                    onClick={() => setSelectedCustomer(null)}
                                    className="p-2 rounded-xl text-[#4B5563] hover:text-[#E8ECF1] hover:bg-[#141A23] transition-all border border-transparent hover:border-[#1F2937]"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Customer Summary */}
                            <div className="bg-[#141A23] rounded-2xl p-4 border border-[#1F2937] space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#008DCB]/15 flex items-center justify-center text-[#008DCB]">
                                        <Phone size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-[#E8ECF1]">{selectedCustomer.name || 'Cliente'}</p>
                                        <p className="text-xs font-mono text-[#008DCB]">{selectedCustomer.phone}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2 border-t border-[#1F2937]/50">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#4B5563]">
                                        <Hash size={12} className="text-[#008DCB]" />
                                        <span className="text-[#E8ECF1]">{selectedCustomer.callCount}</span> llamadas
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#4B5563]">
                                        <Clock size={12} className="text-[#67B7AF]" />
                                        <span className="text-[#E8ECF1]">{Math.floor(selectedCustomer.totalDuration / 60)}m {selectedCustomer.totalDuration % 60}s</span> total
                                    </div>
                                </div>

                                {/* Latest Extracted Data */}
                                {Object.keys(selectedCustomer.latestCustomData).length > 0 && (
                                    <div className="pt-2 border-t border-[#1F2937]/50 space-y-1.5">
                                        <p className="text-[9px] font-black text-[#4B5563] uppercase tracking-widest">Datos Extraídos (Última Llamada)</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(selectedCustomer.latestCustomData).map(([key, value]) => (
                                                <div key={key} className="bg-[#0E1219] rounded-lg px-2.5 py-1.5 border border-[#1F2937]/50">
                                                    <p className="text-[9px] font-bold text-[#4B5563] uppercase tracking-wider">{key.replace(/_/g, ' ')}</p>
                                                    <p className="text-xs font-medium text-[#E8ECF1] truncate">{String(value)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Call List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                            <p className="text-[10px] font-black text-[#4B5563] uppercase tracking-widest mb-2">
                                Todas las Llamadas ({selectedCustomer.calls.length})
                            </p>

                            {selectedCustomer.calls.map((call) => {
                                const customData = parseCustomData(call.custom_analysis_data);
                                return (
                                    <div key={call.id} className="bg-[#141A23] border border-[#1F2937] rounded-xl p-4 space-y-3 hover:border-[#008DCB]/20 transition-all">
                                        {/* Call Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-[#008DCB]/10 flex items-center justify-center text-[#008DCB]">
                                                    <Phone size={12} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-[#E8ECF1] tabular-nums">
                                                        {format(new Date(call.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                                                    </p>
                                                    <p className="text-[10px] text-[#4B5563] font-bold tabular-nums">
                                                        {format(new Date(call.created_at), 'HH:mm')}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-[#67B7AF] bg-[#67B7AF]/10 px-2 py-1 rounded-md border border-[#67B7AF]/20">
                                                {call.duration_seconds
                                                    ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`
                                                    : '0s'}
                                            </span>
                                        </div>

                                        {/* Call Summary */}
                                        {call.call_summary && (
                                            <div className="flex gap-2 items-start">
                                                <FileText size={12} className="text-[#4B5563] mt-0.5 shrink-0" />
                                                <p className="text-[11px] text-[rgba(255,255,255,0.6)] leading-relaxed line-clamp-3">
                                                    {call.call_summary}
                                                </p>
                                            </div>
                                        )}

                                        {/* Extracted Data */}
                                        {Object.keys(customData).length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#1F2937]/50">
                                                {Object.entries(customData).map(([key, value]) => (
                                                    <span key={key} className="text-[10px] font-medium bg-[#0E1219] text-[rgba(255,255,255,0.6)] px-2 py-0.5 rounded border border-[#1F2937]/50">
                                                        <b className="text-[#4B5563]">{key.replace(/_/g, ' ')}:</b> {String(value)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Recording Link */}
                                        {call.recording_url && (
                                            <a
                                                href={call.recording_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-[10px] font-bold text-[#008DCB] hover:text-[#008DCB]/80 transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Mic size={12} />
                                                Escuchar grabación
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
