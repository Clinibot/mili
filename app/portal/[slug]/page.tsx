"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import KpiCards from './KpiCards';
import DateRangeSelector from './DateRangeSelector';
import AnalyticsCharts from './AnalyticsCharts';
import { subDays } from 'date-fns';
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

    return (
        <div className="max-w-7xl w-full mx-auto p-6 lg:p-12 space-y-12">
            {/* Header Welcome */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <p className="text-blue-600 font-sans text-xs uppercase tracking-[0.2em] mb-2 font-bold">Resumen de actividad</p>
                    <h2 className="font-header text-4xl font-black tracking-tight text-slate-900">Panel de Control</h2>
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
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                        Exportar Datos
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
                <Card id="llamadas" className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white">
                    <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <CardTitle className="text-xl font-bold text-slate-800 tracking-tight">Llamadas Recientes</CardTitle>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[10px] font-bold">VIVO</span>
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm font-medium">Gestión y detalle de todas las interacciones.</p>
                        </div>
                        <button className="text-blue-600 font-bold text-sm hover:underline">Ver todo</button>
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
                .limit(10);

            if (data) setCalls(data);
            setLoading(false);
        }
        fetchCalls();
    }, [clientId]);

    if (loading) return <div className="p-6 text-center text-slate-400">Cargando llamadas...</div>;
    if (calls.length === 0) return <div className="p-6 text-center text-slate-400">No hay llamadas registradas.</div>;

    return (
        <div>
            {calls.map((call) => (
                <div key={call.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <div
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                    >
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-sm font-bold text-slate-800">{call.from_number || 'Desconocido'}</p>
                                <p className="text-xs text-slate-400">{new Date(Number(call.start_timestamp)).toLocaleString('es-ES')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-xs font-bold text-slate-700">
                                {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : '0s'}
                            </span>
                            <span className={`text-[10px] font-medium ${call.call_successful ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {call.call_status}
                            </span>
                        </div>
                    </div>

                    {expandedCall === call.id && (
                        <div className="bg-slate-50/50 p-4 pt-0 text-sm space-y-3 animate-in slide-in-from-top-2">
                            {call.call_summary && (
                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                    <p className="font-semibold text-slate-700 mb-1">Resumen</p>
                                    <p className="text-slate-600 text-xs leading-relaxed">{call.call_summary}</p>
                                </div>
                            )}
                            {call.recording_url && (
                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                    <p className="font-semibold text-slate-700 mb-2">Grabación</p>
                                    <audio controls src={call.recording_url} className="w-full h-8" />
                                </div>
                            )}
                            {call.transcript && (
                                <details className="group">
                                    <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors list-none">
                                        Ver Transcripción Completa
                                    </summary>
                                    <div className="mt-2 p-3 bg-white rounded-xl border border-slate-100 text-xs text-slate-600 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                        {call.transcript}
                                    </div>
                                </details>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
