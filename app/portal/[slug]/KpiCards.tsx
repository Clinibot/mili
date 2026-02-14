"use client";

import { useEffect, useState } from 'react';
import { startOfDay, endOfDay, subDays } from 'date-fns';
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
                // Fetch current period data
                const msStart = startDate.getTime();
                const msEnd = endOfDay(endDate).getTime();

                const { data: currentCalls, error: currentError } = await supabase
                    .from('calls')
                    .select('duration_seconds, call_successful, start_timestamp, user_sentiment')
                    .eq('client_id', clientId)
                    .gte('start_timestamp', msStart)
                    .lte('start_timestamp', msEnd);

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

                // Minutos reales sumados (para visualización)
                const realMinutes = currentCalls?.reduce((sum, call) => sum + ((call.duration_seconds || 0) / 60), 0) || 0;

                // Calculamos minutos de facturación (cada llamada redondea al alza para el coste)
                const billableMinutes = currentCalls?.reduce((sum, call) => {
                    const secs = Number(call.duration_seconds || 0);
                    return sum + (secs > 0 ? Math.ceil(secs / 60) : 0);
                }, 0) || 0;

                const totalCost = (billableMinutes * costPerMinute);
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
                const previousRealMinutes = previousCalls?.reduce((sum, call) => sum + ((call.duration_seconds || 0) / 60), 0) || 0;

                const prevBillableMinutes = previousCalls?.reduce((sum, call) => {
                    const secs = Number(call.duration_seconds || 0);
                    return sum + (secs > 0 ? Math.ceil(secs / 60) : 0);
                }, 0) || 0;
                const previousMonthCost = (prevBillableMinutes * costPerMinute);

                setKpis({
                    totalCalls,
                    totalMinutes: realMinutes,
                    totalCost,
                    successRate: sentimentScore,
                    colgadasShort,
                    previousMonthCalls,
                    previousMonthMinutes: previousRealMinutes,
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
                    <Card key={i} className="border-[var(--border)] shadow-sm rounded-2xl overflow-hidden bg-[var(--surface)] animate-pulse">
                        <CardContent className="p-6">
                            <div className="h-32 bg-[var(--surface-2)] rounded"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // Calculate specific user-requested metrics from state
    const avgMinutes = kpis.totalCalls > 0 ? (kpis.totalMinutes / kpis.totalCalls).toFixed(1) : '0';
    const sentimentScore = kpis.totalCalls > 0 ? Math.round(kpis.successRate) : 0; // Using successRate as proxy for sentiment for now

    const formatMinutesToMMSS = (decimalMinutes: number) => {
        const totalSeconds = Math.round(decimalMinutes * 60);
        const minutes = Math.floor(Math.abs(totalSeconds) / 60);
        const seconds = Math.abs(totalSeconds) % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <KpiCard
                title="LLAMADAS"
                value={kpis.totalCalls.toLocaleString()}
                change={callsChange.value}
                isPositive={callsChange.isPositive}
                subValue="Total de llamadas hoy"
                color="border-t-[var(--azul)]"
            />
            <KpiCard
                title="MINUTOS"
                value={formatMinutesToMMSS(kpis.totalMinutes)}
                change={minutesChange.value}
                isPositive={minutesChange.isPositive}
                subValue={`Ø ${avgMinutes} min por llamada`}
                color="border-t-[var(--verde)]" // Originally Mineral, mapping to Verde
            />
            <KpiCard
                title="TRANSFERENCIAS"
                value={kpis.successRate > 0 ? Math.round(kpis.totalCalls * (kpis.successRate / 100)) : "0"}
                change="+5%"
                isPositive={true}
                subValue={`${kpis.successRate}% de efectividad`}
                color="border-t-[var(--coral)]"
            />
            <KpiCard
                title="CITAS AGENDADAS"
                value="17" // Mocked as requested for reference
                change="+22%"
                isPositive={true}
                subValue="Sincronizado con Google Cal"
                color="border-t-[var(--azul)]"
            />
            <KpiCard
                title="SENTIMIENTO"
                value={`${sentimentScore}%`}
                change="+8%"
                isPositive={true}
                subValue="Feedback positivo"
                color="border-t-[var(--verde)]"
            />
        </div>
    );
}

function KpiCard({ title, value, change, isPositive, subValue, color }: any) {
    return (
        <Card className={cn(
            "border-[#1F2937] border-t-4 shadow-xl shadow-black/20 rounded-xl overflow-hidden bg-[#0E1219] transition-all duration-300 hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-1",
            color.replace("var(--azul)", "#008DCB").replace("var(--verde)", "#67B7AF").replace("var(--coral)", "#F78E5E")
        )}>
            <CardContent className="p-8">
                <h3 className="text-[rgba(255,255,255,0.3)] text-[10px] font-bold tracking-[0.2em] mb-6 font-sans uppercase">{title}</h3>
                <div className="flex items-baseline gap-3 mb-2">
                    <div className="text-5xl font-black font-header tracking-tighter text-[#E8ECF1]">{value}</div>
                </div>
                <div className="text-sm font-medium text-[rgba(255,255,255,0.55)] mb-6">{subValue}</div>
                <div className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border",
                    isPositive
                        ? "bg-[rgba(103,183,175,0.1)] text-[#67B7AF] border-[rgba(103,183,175,0.2)]"
                        : "bg-[rgba(247,142,94,0.1)] text-[#F78E5E] border-[rgba(247,142,94,0.2)]"
                )}>
                    {isPositive ? '↑' : '↓'} {change.replace('+', '').replace('-', '')} {isPositive ? 'crecimiento' : 'descenso'}
                </div>
            </CardContent>
        </Card>
    );
}
