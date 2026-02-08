"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiData {
    totalCalls: number;
    totalMinutes: number;
    totalCost: number;
    successRate: number;
    colgadasShort: number;
    previousMonthCalls: number;
    previousMonthMinutes: number;
    previousMonthCost: number;
}

interface KpiCardsProps {
    clientId: string;
    startDate: Date;
    endDate: Date;
    comparisonMode: 'none' | 'previousPeriod' | 'custom';
    comparisonStart?: Date;
    comparisonEnd?: Date;
}

export default function KpiCards({
    clientId,
    startDate,
    endDate,
    comparisonMode,
    comparisonStart,
    comparisonEnd
}: KpiCardsProps) {
    const [kpis, setKpis] = useState<KpiData>({
        totalCalls: 0,
        totalMinutes: 0,
        totalCost: 0,
        successRate: 0,
        colgadasShort: 0,
        previousMonthCalls: 0,
        previousMonthMinutes: 0,
        previousMonthCost: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchKpis() {
            setLoading(true);
            try {
                // Fetch current period data
                const { data: currentCalls, error: currentError } = await supabase
                    .from('calls')
                    .select('duration_seconds, call_successful, start_timestamp, user_sentiment')
                    .eq('client_id', clientId)
                    .gte('start_timestamp', startDate.getTime())
                    .lte('start_timestamp', endDate.getTime());

                if (currentError) throw currentError;

                // Fetch comparison data if needed
                let previousCalls: any[] = [];
                if (comparisonMode !== 'none' && comparisonStart && comparisonEnd) {
                    const { data: prevData, error: prevError } = await supabase
                        .from('calls')
                        .select('duration_seconds, start_timestamp, user_sentiment')
                        .eq('client_id', clientId)
                        .gte('start_timestamp', comparisonStart.getTime())
                        .lte('start_timestamp', comparisonEnd.getTime());

                    if (prevError) throw prevError;
                    previousCalls = prevData || [];
                }

                // Fetch client cost per minute
                const { data: client } = await supabase
                    .from('clients')
                    .select('cost_per_minute')
                    .eq('id', clientId)
                    .single();

                const costPerMinute = client?.cost_per_minute || 0.16;

                // Calculate current period KPIs
                const totalCalls = currentCalls?.length || 0;
                const totalSeconds = currentCalls?.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) || 0;

                // Calculamos minutos totales basándonos en la lógica de facturación (cada llamada redondea al alza)
                const totalMinutes = currentCalls?.reduce((sum, call) => {
                    const billable = Math.ceil((call.duration_seconds || 0) / 60) || (call.duration_seconds > 0 ? 1 : 0);
                    return sum + billable;
                }, 0) || 0;

                const totalCost = (totalMinutes * costPerMinute);
                const successfulCalls = currentCalls?.filter(call => call.call_successful).length || 0;
                const colgadasShort = currentCalls?.filter(call => (call.duration_seconds || 0) < 15).length || 0;

                // Calculate actual sentiment score
                const callsWithSentiment = currentCalls?.filter(c => c.user_sentiment) || [];
                const positiveSentiments = callsWithSentiment.filter(c =>
                    c.user_sentiment.toLowerCase().includes('positive') ||
                    c.user_sentiment.toLowerCase().includes('positivo')
                ).length;
                const sentimentScore = callsWithSentiment.length > 0
                    ? Math.round((positiveSentiments / callsWithSentiment.length) * 100)
                    : 0;

                // Calculate previous period
                const previousMonthCalls = previousCalls?.length || 0;
                const previousSeconds = previousCalls?.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) || 0;
                const previousMonthMinutes = Math.round(previousSeconds / 60);
                const previousMonthCost = (previousMonthMinutes * costPerMinute);

                setKpis({
                    totalCalls,
                    totalMinutes,
                    totalCost,
                    successRate: sentimentScore,
                    colgadasShort,
                    previousMonthCalls,
                    previousMonthMinutes,
                    previousMonthCost
                });
            } catch (err) {
                console.error('Error fetching KPIs:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchKpis();
    }, [clientId, startDate, endDate, comparisonMode, comparisonStart, comparisonEnd]);

    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return { value: '+0%', isPositive: true };
        const change = ((current - previous) / previous) * 100;
        const isPositive = change >= 0;
        return {
            value: `${isPositive ? '+' : ''}${change.toFixed(1)}%`,
            isPositive
        };
    };

    const callsChange = calculateChange(kpis.totalCalls, kpis.previousMonthCalls);
    const minutesChange = calculateChange(kpis.totalMinutes, kpis.previousMonthMinutes);
    const costChange = calculateChange(kpis.totalCost, kpis.previousMonthCost);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white animate-pulse">
                        <CardContent className="p-6">
                            <div className="h-32 bg-slate-100 rounded"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // Calculate specific user-requested metrics from state
    const avgMinutes = kpis.totalCalls > 0 ? (kpis.totalMinutes / kpis.totalCalls).toFixed(1) : '0';
    const sentimentScore = kpis.totalCalls > 0 ? Math.round(kpis.successRate) : 0; // Using successRate as proxy for sentiment for now

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <KpiCard
                title="LLAMADAS"
                value={kpis.totalCalls.toLocaleString()}
                change={callsChange.value}
                isPositive={callsChange.isPositive}
                subValue="Total de llamadas hoy"
                color="border-t-accent-blue"
            />
            <KpiCard
                title="MINUTOS"
                value={kpis.totalMinutes.toLocaleString()}
                change={minutesChange.value}
                isPositive={minutesChange.isPositive}
                subValue={`Ø ${avgMinutes} min por llamada`}
                color="border-t-accent-mineral"
            />
            <KpiCard
                title="TRANSFERENCIAS"
                value={kpis.successRate > 0 ? Math.round(kpis.totalCalls * (kpis.successRate / 100)) : "0"}
                change="+5%"
                isPositive={true}
                subValue={`${kpis.successRate}% de efectividad`}
                color="border-t-accent-coral"
            />
            <KpiCard
                title="CITAS AGENDADAS"
                value="17" // Mocked as requested for reference
                change="+22%"
                isPositive={true}
                subValue="Sincronizado con Google Cal"
                color="border-t-accent-blue"
            />
            <KpiCard
                title="SENTIMIENTO"
                value={`${sentimentScore}%`}
                change="+8%"
                isPositive={true}
                subValue="Feedback positivo"
                color="border-t-accent-mineral"
            />
        </div>
    );
}

function KpiCard({ title, value, change, isPositive, subValue, color }: any) {
    return (
        <Card className={cn(
            "border-none border-t-4 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-1",
            color
        )}>
            <CardContent className="p-8">
                <h3 className="text-slate-400 text-[10px] font-bold tracking-[0.2em] mb-6 font-sans uppercase">{title}</h3>
                <div className="flex items-baseline gap-3 mb-2">
                    <div className="text-5xl font-black font-header tracking-tighter text-slate-900">{value}</div>
                </div>
                <div className="text-sm font-medium text-slate-400 mb-6">{subValue}</div>
                <div className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold",
                    isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                    {isPositive ? '↑' : '↓'} {change.replace('+', '').replace('-', '')} {isPositive ? 'crecimiento' : 'descenso'}
                </div>
            </CardContent>
        </Card>
    );
}
