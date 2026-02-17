"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { format, eachDayOfInterval, startOfWeek, eachWeekOfInterval, eachMonthOfInterval, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TransferDataPoint {
    date: string;
    total: number;
    effective: number;
}

interface TransferAnalyticsProps {
    clientId: string;
    startDate: Date;
    endDate: Date;
    viewMode: 'daily' | 'weekly' | 'monthly';
}

export default function TransferAnalytics({ clientId, startDate, endDate, viewMode }: TransferAnalyticsProps) {
    const [data, setData] = useState<TransferDataPoint[]>([]);
    const [kpis, setKpis] = useState({
        totalAttempts: 0,
        effectiveTransfers: 0,
        successRate: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransferData();
    }, [clientId, startDate, endDate, viewMode]);

    const fetchTransferData = async () => {
        setLoading(true);
        try {
            const msEnd = endOfDay(endDate).getTime();

            // Fetch calls that were either attempted or successful transfers
            const { data: calls, error } = await supabase
                .from('calls')
                .select('start_timestamp, transfer_attempted, transfer_successful')
                .eq('client_id', clientId)
                .gte('start_timestamp', startDate.getTime())
                .lte('start_timestamp', msEnd)
                .or('transfer_attempted.eq.true,transfer_successful.eq.true');

            if (error) throw error;

            const aggregated = aggregateData(calls || []);
            setData(aggregated);

            const total = calls?.filter(c => (c as any).transfer_attempted).length || 0;
            const effective = calls?.filter(c => (c as any).transfer_successful).length || 0;

            setKpis({
                totalAttempts: total,
                effectiveTransfers: effective,
                successRate: total > 0 ? Math.round((effective / total) * 100) : 0
            });

        } catch (error) {
            console.error('Error fetching transfer data:', error);
        } finally {
            setLoading(false);
        }
    };

    const aggregateData = (calls: any[]): TransferDataPoint[] => {
        let intervals: Date[] = [];
        let formatString = '';

        if (viewMode === 'daily') {
            intervals = eachDayOfInterval({ start: startDate, end: endDate });
            formatString = 'd MMM';
        } else if (viewMode === 'weekly') {
            intervals = eachWeekOfInterval({ start: startDate, end: endDate }).map(date => startOfWeek(date));
            formatString = "'Sem' w";
        } else {
            intervals = eachMonthOfInterval({ start: startDate, end: endDate }).map(date => startOfMonth(date));
            formatString = 'MMM yyyy';
        }

        return intervals.map((date) => {
            let periodEnd: Date;
            if (viewMode === 'daily') periodEnd = endOfDay(date);
            else if (viewMode === 'weekly') periodEnd = endOfWeek(date);
            else periodEnd = endOfMonth(date);

            const periodCalls = calls.filter((call) => {
                const callDate = new Date(Number(call.start_timestamp));
                return callDate >= date && callDate <= periodEnd;
            });

            return {
                date: format(date, formatString, { locale: es }),
                total: periodCalls.filter(c => c.transfer_attempted).length,
                effective: periodCalls.filter(c => c.transfer_successful).length,
            };
        });
    };

    if (loading) return <div className="h-64 animate-pulse bg-[#0E1219] rounded-xl border border-[#1F2937]" />;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Transfer Chart */}
                <Card className="lg:col-span-2 border-[#1F2937] shadow-xl shadow-black/20 rounded-xl overflow-hidden bg-[#0E1219] p-8">
                    <CardHeader className="p-0 mb-8">
                        <p className="text-[#F78E5E] font-sans text-[10px] uppercase tracking-widest font-bold mb-1">Análisis de Transferencias</p>
                        <CardTitle className="text-2xl font-black font-header tracking-tight text-[#E8ECF1]">Transferencias vs Efectivas</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F78E5E" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#F78E5E" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="effectiveGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#67B7AF" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#67B7AF" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" fontSize={10} tick={{ fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis stroke="rgba(255,255,255,0.1)" fontSize={10} tick={{ fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0E1219', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                    <Area type="monotone" dataKey="total" stroke="#F78E5E" strokeWidth={3} fill="url(#totalGradient)" name="Intentos" />
                                    <Area type="monotone" dataKey="effective" stroke="#67B7AF" strokeWidth={3} fill="url(#effectiveGradient)" name="Efectivas" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Transfer KPIs */}
                <div className="space-y-4">
                    <TransferKpi
                        title="TRANSFERENCIAS TOTALES"
                        value={kpis.totalAttempts.toString()}
                        subValue="Intentos realizados"
                        color="border-t-[#F78E5E]"
                    />
                    <TransferKpi
                        title="TRANSFERENCIAS EFECTIVAS"
                        value={kpis.effectiveTransfers.toString()}
                        subValue="Conectadas con éxito"
                        color="border-t-[#67B7AF]"
                    />
                    <TransferKpi
                        title="TASA DE ÉXITO"
                        value={`${kpis.successRate}%`}
                        subValue="Efectividad en desvíos"
                        color="border-t-[#008DCB]"
                    />
                </div>
            </div>
        </div>
    );
}

function TransferKpi({ title, value, subValue, color }: { title: string, value: string, subValue: string, color: string }) {
    return (
        <Card className={cn(
            "border-[#1F2937] border-t-4 shadow-xl shadow-black/20 rounded-xl overflow-hidden bg-[#0E1219] transition-all duration-300 hover:shadow-2xl",
            color
        )}>
            <CardContent className="p-6">
                <h3 className="text-[rgba(255,255,255,0.3)] text-[8px] font-bold tracking-[0.2em] mb-4 font-sans uppercase truncate">{title}</h3>
                <div className="text-3xl font-black font-header tracking-tighter text-[#E8ECF1] mb-1">{value}</div>
                <div className="text-[10px] font-medium text-[rgba(255,255,255,0.55)] uppercase tracking-wider">{subValue}</div>
            </CardContent>
        </Card>
    );
}
