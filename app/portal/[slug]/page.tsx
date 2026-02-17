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
import CallsList from '@/components/CallsList';
import TransferAnalytics from './TransferAnalytics';

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
    const [searchQuery, setSearchQuery] = useState('');

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

                {/* Transfer Analytics Section */}
                <TransferAnalytics
                    clientId={client.id}
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    viewMode={dateRange.viewMode}
                />

                {/* Recent Calls List Full Width */}
                <Card id="llamadas" className="border-[#1F2937] shadow-xl shadow-black/20 rounded-xl overflow-hidden bg-[#0E1219]">
                    <CardHeader className="p-8 border-b border-[#1F2937]/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                        <div className="flex items-center gap-4 flex-1 max-w-md">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Buscar por número (+34...)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#141A23] border border-[#1F2937] text-[#E8ECF1] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#008DCB]/50 transition-all placeholder:text-[rgba(255,255,255,0.2)]"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)] hover:text-[#E8ECF1]"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            <button className="text-[#008DCB] font-bold text-sm hover:underline shrink-0">Ver todo</button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 max-h-[800px] overflow-y-auto custom-scrollbar">
                        <CallsList clientId={client.id} searchQuery={searchQuery} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

