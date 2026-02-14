"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import KpiCards from './KpiCards';
import DateRangeSelector from './DateRangeSelector';
import AnalyticsCharts from './AnalyticsCharts';
import { subDays, format, endOfDay } from 'date-fns';
import { usePortal } from './PortalContext';
import { supabase } from '@/lib/supabaseClient';
import { useEffect } from 'react';

export default function ClientPortal() {
    const { client, slug } = usePortal();
    const [dateRange, setDateRange] = useState({
        startDate: subDays(new Date(), 6),
        endDate: new Date(),
        viewMode: 'daily' as 'daily' | 'weekly' | 'monthly',
        comparisonMode: 'none' as 'none' | 'previousPeriod' | 'custom',
        comparisonStart: undefined as Date | undefined,
        comparisonEnd: undefined as Date | undefined,
    });

    if (!client) return null;

    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const msEnd = endOfDay(dateRange.endDate).getTime();

            const { data: calls, error } = await supabase
                .from('calls')
                .select('*')
                .eq('client_id', client.id)
                .gte('start_timestamp', dateRange.startDate.getTime())
                .lte('start_timestamp', msEnd)
                .order('start_timestamp', { ascending: false });

            if (error) throw error;

            if (!calls || calls.length === 0) {
                toast.error('No hay datos para exportar en este periodo');
                return;
            }

            // Generate CSV
            const headers = ['ID', 'Fecha', 'Hora', 'Origen', 'Duración (s)', 'Estado', 'Resumen', 'Sentimiento'];
            const csvRows = [headers.join(',')];

            for (const call of calls) {
                const date = new Date(Number(call.start_timestamp));
                const row = [
                    call.id,
                    date.toLocaleDateString(),
                    date.toLocaleTimeString(),
                    call.from_number,
                    call.duration_seconds,
                    call.call_status,
                    `"${(call.call_summary || '').replace(/"/g, '""')}"`,
                    call.user_sentiment
                ];
                csvRows.push(row.join(','));
            }

            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte-llamadas-${slug}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Informe descargado correctamente');

        } catch (error: any) {
            console.error('Error exporting:', error);
            toast.error('Error al exportar datos');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="max-w-7xl w-full mx-auto p-6 lg:p-12 space-y-12">
            {/* Header Welcome */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <p className="text-[#008DCB] font-sans text-xs uppercase tracking-[0.2em] mb-2 font-bold">Resumen de actividad</p>
                    <h2 className="font-header text-4xl font-black tracking-tight text-[#E8ECF1]">Panel de Control</h2>
                </div>
                <div className="flex gap-4">
                    <DateRangeSelector
                        onRangeChange={(start, end, view, comparison, compStart, compEnd) => {
                            setDateRange({
                                startDate: start,
                                endDate: end,
                                viewMode: view,
                                comparisonMode: comparison,
                                comparisonStart: compStart,
                                comparisonEnd: compEnd,
                            });
                        }}
                    />
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="bg-[#008DCB] hover:bg-[#141A23] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-[rgba(0,141,203,0.2)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-transparent hover:border-[#008DCB]"
                    >
                        {isExporting ? (
                            <>
                                <span className="animate-spin">⏳</span> Exportando...
                            </>
                        ) : (
                            'Exportar Datos'
                        )}
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <KpiCards
                clientId={client.id}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                comparisonMode={dateRange.comparisonMode}
                comparisonStart={dateRange.comparisonStart}
                comparisonEnd={dateRange.comparisonEnd}
            />

            {/* Charts Stack */}
            <div className="space-y-12">
                <AnalyticsCharts
                    clientId={client.id}
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    viewMode={dateRange.viewMode}
                    comparisonMode={dateRange.comparisonMode}
                    comparisonStart={dateRange.comparisonStart}
                    comparisonEnd={dateRange.comparisonEnd}
                />

                {/* Recent Calls List Full Width */}
                <Card id="llamadas" className="border-[#1F2937] shadow-xl shadow-black/20 rounded-xl overflow-hidden bg-[#0E1219]">
                    <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between border-b border-[#1F2937]">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <CardTitle className="text-xl font-bold text-[#E8ECF1] tracking-tight">Llamadas Recientes</CardTitle>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[rgba(103,183,175,0.1)] text-[#67B7AF] rounded-full border border-[rgba(103,183,175,0.2)]">
                                    <span className="w-1 h-1 rounded-full bg-[#67B7AF] animate-pulse"></span>
                                    <span className="text-[10px] font-bold">VIVO</span>
                                </div>
                            </div>
                            <p className="text-[rgba(255,255,255,0.55)] text-sm font-medium">Gestión y detalle de todas las interacciones.</p>
                        </div>
                        <button className="text-[#008DCB] font-bold text-sm hover:underline">Ver todo</button>
                    </CardHeader>
                    <CardContent className="p-0 max-h-[800px] overflow-y-auto custom-scrollbar">
                        <CallsList clientId={client.id} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function CallsList({ clientId }: { clientId: string }) {
    const [calls, setCalls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCall, setExpandedCall] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCalls() {
            const { data, error } = await supabase
                .from('calls')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) setCalls(data);
            setLoading(false);
        }
        fetchCalls();
    }, [clientId]);

    if (loading) return <div className="p-8 text-center text-[rgba(255,255,255,0.55)] font-medium">Cargando llamadas...</div>;
    if (calls.length === 0) return (
        <div className="p-12 text-center text-[rgba(255,255,255,0.3)] space-y-3">
            <div className="text-4xl opacity-50">📞</div>
            <p className="font-medium">No hay llamadas registradas todavía.</p>
        </div>
    );

    return (
        <div className="divide-y divide-[#1F2937]">
            {calls.map((call) => {
                const isPlayground = !call.from_number || call.from_number.includes('playground') || call.direction === 'outbound';
                const callerDisplay = isPlayground ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#141A23] text-[rgba(255,255,255,0.55)] rounded border border-[rgba(255,255,255,0.1)] text-[10px] font-bold uppercase tracking-wider">
                        Playground
                    </span>
                ) : (
                    <span className="text-sm font-bold text-[#E8ECF1]">{call.from_number}</span>
                );

                return (
                    <div key={call.id} className="hover:bg-[#141A23] transition-all duration-200">
                        <div
                            className="flex items-center justify-between p-6 cursor-pointer"
                            onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center text-lg border",
                                    call.call_successful
                                        ? "bg-[rgba(103,183,175,0.1)] text-[#67B7AF] border-[rgba(103,183,175,0.2)]"
                                        : "bg-[#141A23] text-[rgba(255,255,255,0.3)] border-[#1F2937]"
                                )}>
                                    {isPlayground ? "💻" : "📱"}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        {callerDisplay}
                                        {call.call_successful && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#67B7AF]"></span>
                                        )}
                                    </div>
                                    <p className="text-[11px] font-semibold text-[rgba(255,255,255,0.3)] tabular-nums">
                                        {new Date(Number(call.start_timestamp)).toLocaleString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1.5">
                                <div className="flex items-center gap-2 text-[rgba(255,255,255,0.3)] group-hover:text-[#008DCB] transition-colors">
                                    <span className="text-sm font-black text-[#E8ECF1] tabular-nums">
                                        {call.duration_seconds
                                            ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`
                                            : '0s'}
                                    </span>
                                    {expandedCall === call.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight border",
                                    call.call_successful
                                        ? "bg-[rgba(103,183,175,0.1)] text-[#67B7AF] border-[rgba(103,183,175,0.2)]"
                                        : "bg-[rgba(247,142,94,0.1)] text-[#F78E5E] border-[rgba(247,142,94,0.2)]"
                                )}>
                                    {call.call_successful ? 'EXITOSA' : (call.call_status || 'TERMINADA')}
                                </span>
                            </div>
                        </div>

                        {expandedCall === call.id && (
                            <div className="bg-[rgba(20,26,35,0.5)] p-6 pt-0 space-y-5 animate-in slide-in-from-top-2 duration-300 border-t border-[#1F2937]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                    {call.call_summary && (
                                        <div className="bg-[#0E1219] p-4 rounded-xl border border-[#1F2937] shadow-sm">
                                            <p className="text-[10px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-widest mb-2">Resumen de IA</p>
                                            <p className="text-[rgba(255,255,255,0.55)] text-xs leading-relaxed font-medium">{call.call_summary}</p>
                                        </div>
                                    )}

                                    {call.custom_analysis_data && Object.keys(call.custom_analysis_data).length > 0 && (
                                        <div className="bg-[#0E1219] p-4 rounded-xl border border-[#1F2937] shadow-sm">
                                            <p className="text-[10px] font-bold text-[#008DCB] uppercase tracking-widest mb-2">Datos Extraídos</p>
                                            <div className="space-y-2">
                                                {Object.entries(call.custom_analysis_data).map(([key, value]: [string, any]) => (
                                                    <div key={key} className="flex justify-between items-start gap-4 border-b border-[#1F2937] last:border-0 pb-1.5 mb-1.5">
                                                        <span className="text-[10px] font-bold text-[rgba(255,255,255,0.3)] uppercase">{key.replace(/_/g, ' ')}</span>
                                                        <span className="text-[11px] font-bold text-[#E8ECF1] text-right">{String(value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {call.recording_url && (
                                    <div className="bg-[#0E1219] p-4 rounded-xl border border-[#1F2937] shadow-sm">
                                        <p className="text-[10px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-widest mb-3">Grabación de audio</p>
                                        <audio controls src={call.recording_url} className="w-full h-10" />
                                    </div>
                                )}

                                {call.transcript && (
                                    <div className="bg-[#0E1219] p-4 rounded-xl border border-[#1F2937] shadow-sm overflow-hidden">
                                        <p className="text-[10px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-widest mb-3">Transcripción completa</p>
                                        <div className="max-h-48 overflow-y-auto pr-2 text-[11px] text-[rgba(255,255,255,0.55)] leading-relaxed font-medium whitespace-pre-wrap custom-scrollbar">
                                            {call.transcript}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
