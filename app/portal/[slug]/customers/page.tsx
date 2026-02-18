"use client";

import { useEffect, useState, useMemo } from 'react';
import { usePortal } from '../PortalContext';
import { supabase } from '@/lib/supabaseClient';
import {
    Search, Download, Filter, ChevronDown,
    MoreHorizontal, User, Phone, Calendar,
    Columns, Check, X, FileDown, Table
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function CustomersPage() {
    const { client: portalClient } = usePortal();
    const [calls, setCalls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleColumns, setVisibleColumns] = useState<string[]>(['fecha', 'telefono', 'nombre', 'duracion']);
    const [availableAIFields, setAvailableAIFields] = useState<string[]>([]);
    const [showColumnPicker, setShowColumnPicker] = useState(false);

    useEffect(() => {
        if (!portalClient?.id) return;
        fetchData(portalClient.id);
    }, [portalClient?.id]);

    async function fetchData(clientId: string) {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('calls')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setCalls(data || []);

            // Extract dynamic AI fields from custom_analysis_data
            const aiFields = new Set<string>();
            data?.forEach(call => {
                const customData = call.custom_analysis_data;
                if (customData && typeof customData === 'object') {
                    Object.keys(customData).forEach(key => aiFields.add(key));
                } else if (customData && typeof customData === 'string') {
                    try {
                        const parsed = JSON.parse(customData);
                        Object.keys(parsed).forEach(key => aiFields.add(key));
                    } catch (e) { }
                }
            });

            const fields = Array.from(aiFields);
            setAvailableAIFields(fields);

            // Add some meaningful AI fields to defaults if not already set
            if (fields.length > 0 && visibleColumns.length <= 4) {
                const topFields = fields.slice(0, 3);
                setVisibleColumns(prev => [...prev, ...topFields]);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    }

    const filteredCalls = useMemo(() => {
        return calls.filter(call => {
            const search = searchTerm.toLowerCase();
            const phoneMatch = call.from_number?.toLowerCase().includes(search) || call.to_number?.toLowerCase().includes(search);

            // Search in custom data (potential names, etc.)
            let customMatch = false;
            const customData = call.custom_analysis_data;
            if (customData) {
                const dataString = typeof customData === 'string' ? customData : JSON.stringify(customData);
                customMatch = dataString.toLowerCase().includes(search);
            }

            return phoneMatch || customMatch;
        });
    }, [calls, searchTerm]);

    const exportToCSV = () => {
        if (filteredCalls.length === 0) return;

        // Header
        const headers = visibleColumns.map(col => {
            if (col === 'fecha') return 'Fecha';
            if (col === 'telefono') return 'Teléfono';
            if (col === 'nombre') return 'Nombre (IA)';
            if (col === 'duracion') return 'Duración';
            return col;
        });

        const rows = filteredCalls.map(call => {
            return visibleColumns.map(col => {
                if (col === 'fecha') return format(new Date(call.created_at), 'dd/MM/yyyy HH:mm');
                if (col === 'telefono') return call.from_number || call.to_number || 'N/A';
                if (col === 'nombre') {
                    const data = typeof call.custom_analysis_data === 'string'
                        ? JSON.parse(call.custom_analysis_data || '{}')
                        : (call.custom_analysis_data || {});
                    return data.nombre || data.Nombre || 'N/A';
                }
                if (col === 'duracion') return call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : '0s';

                // AI Fields
                const data = typeof call.custom_analysis_data === 'string'
                    ? JSON.parse(call.custom_analysis_data || '{}')
                    : (call.custom_analysis_data || {});
                return data[col] || '';
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
        link.setAttribute('download', `clientes_${usePortal().slug}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleColumn = (col: string) => {
        setVisibleColumns(prev =>
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
        );
    };

    return (
        <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-black text-[#E8ECF1] tracking-tight mb-2">
                        Listado de Clientes
                    </h1>
                    <p className="text-[rgba(255,255,255,0.45)] text-sm font-medium">
                        Gestión inteligente de contactos y datos extraídos de llamadas.
                    </p>
                </div>

                <div className="flex items-center gap-3">
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
                                    {['fecha', 'telefono', 'nombre', 'duracion', ...availableAIFields].map(col => (
                                        <button
                                            key={col}
                                            onClick={() => toggleColumn(col)}
                                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#141A23] transition-colors group"
                                        >
                                            <span className="text-xs font-bold text-[#E8ECF1] capitalize">{col.replace(/_/g, ' ')}</span>
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

            {/* Content Table */}
            <div className="bg-[#0E1219] border border-[#1F2937] rounded-3xl overflow-hidden shadow-2xl shadow-black/40">
                {/* Table Filters */}
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
                            {filteredCalls.length} registros
                        </span>
                    </div>
                </div>

                {/* Table Logic */}
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#141A23]/30">
                                {visibleColumns.map(col => (
                                    <th key={col} className="px-6 py-4 text-[10px] font-black text-[#4B5563] uppercase tracking-widest border-b border-[#1F2937]">
                                        {col === 'fecha' ? 'Fecha' :
                                            col === 'telefono' ? 'Teléfono' :
                                                col === 'nombre' ? 'Nombre (IA)' :
                                                    col === 'duracion' ? 'Duración' :
                                                        col.replace(/_/g, ' ')}
                                    </th>
                                ))}
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
                                    </tr>
                                ))
                            ) : filteredCalls.length > 0 ? (
                                filteredCalls.map((call, idx) => {
                                    const customData = typeof call.custom_analysis_data === 'string'
                                        ? JSON.parse(call.custom_analysis_data || '{}')
                                        : (call.custom_analysis_data || {});

                                    return (
                                        <tr key={call.id} className="hover:bg-[#141A23]/40 transition-colors group border-b border-[#1F2937]/30">
                                            {visibleColumns.map(col => (
                                                <td key={col} className="px-6 py-5">
                                                    {col === 'fecha' ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-[#E8ECF1] tabular-nums">
                                                                {format(new Date(call.created_at), 'dd/MM/yyyy')}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-[#4B5563] tabular-nums uppercase">
                                                                {format(new Date(call.created_at), 'HH:mm')}
                                                            </span>
                                                        </div>
                                                    ) : col === 'telefono' ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-lg bg-[#008DCB]/10 flex items-center justify-center text-[#008DCB]">
                                                                <Phone size={12} />
                                                            </div>
                                                            <span className="text-sm font-bold text-[#E8ECF1] tabular-nums">
                                                                {call.from_number || call.to_number || 'N/A'}
                                                            </span>
                                                        </div>
                                                    ) : col === 'nombre' ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-[#E8ECF1]">
                                                                {customData.nombre || customData.Nombre || <span className="text-[#4B5563]/60 italic">No detectado</span>}
                                                            </span>
                                                        </div>
                                                    ) : col === 'duracion' ? (
                                                        <span className="text-xs font-bold text-[#67B7AF] bg-[#67B7AF]/10 px-2 py-1 rounded">
                                                            {call.duration_seconds
                                                                ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`
                                                                : '0s'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-medium text-[rgba(255,255,255,0.7)] line-clamp-2">
                                                            {String(customData[col] || '') || '-'}
                                                        </span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={visibleColumns.length} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-[#141A23] rounded-full text-[#4B5563]">
                                                <Table size={32} />
                                            </div>
                                            <p className="text-[#4B5563] font-bold text-sm uppercase tracking-widest">No se encontraron registros</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
