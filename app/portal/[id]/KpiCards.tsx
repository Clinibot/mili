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
    previousMonthCalls: number;
    previousMonthMinutes: number;
    previousMonthCost: number;
}

export default function KpiCards({ clientId }: { clientId: string }) {
    const [kpis, setKpis] = useState<KpiData>({
        totalCalls: 0,
        totalMinutes: 0,
        totalCost: 0,
        successRate: 0,
        previousMonthCalls: 0,
        previousMonthMinutes: 0,
        previousMonthCost: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchKpis() {
            const now = new Date();
            const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
            const previousMonthEnd = currentMonthStart - 1;

            // Fetch current month data
            const { data: currentCalls } = await supabase
                .from('calls')
                .select('duration_seconds, call_successful, start_timestamp')
                .eq('client_id', clientId)
                .gte('start_timestamp', currentMonthStart);

            // Fetch previous month data for comparison
            const { data: previousCalls } = await supabase
                .from('calls')
                .select('duration_seconds, start_timestamp')
                .eq('client_id', clientId)
                .gte('start_timestamp', previousMonthStart)
                .lte('start_timestamp', previousMonthEnd);

            // Fetch client cost per minute
            const { data: client } = await supabase
                .from('clients')
                .select('cost_per_minute')
                .eq('id', clientId)
                .single();

            const costPerMinute = client?.cost_per_minute || 0.12;

            // Calculate current month KPIs
            const totalCalls = currentCalls?.length || 0;
            const totalSeconds = currentCalls?.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) || 0;
            const totalMinutes = Math.round(totalSeconds / 60);
            const totalCost = (totalMinutes * costPerMinute);
            const successfulCalls = currentCalls?.filter(call => call.call_successful).length || 0;
            const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;

            // Calculate previous month
            const previousMonthCalls = previousCalls?.length || 0;
            const previousSeconds = previousCalls?.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) || 0;
            const previousMonthMinutes = Math.round(previousSeconds / 60);
            const previousMonthCost = (previousMonthMinutes * costPerMinute);

            setKpis({
                totalCalls,
                totalMinutes,
                totalCost,
                successRate,
                previousMonthCalls,
                previousMonthMinutes,
                previousMonthCost
            });
            setLoading(false);
        }
        fetchKpis();
    }, [clientId]);

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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard
                title="Llamadas Totales"
                value={kpis.totalCalls.toLocaleString()}
                change={callsChange.value}
                isPositive={callsChange.isPositive}
                color="bg-blue-500"
            />
            <KpiCard
                title="Minutos Consumidos"
                value={kpis.totalMinutes.toLocaleString()}
                change={minutesChange.value}
                isPositive={minutesChange.isPositive}
                color="bg-purple-500"
            />
            <KpiCard
                title="Coste Estimado"
                value={`€${kpis.totalCost.toFixed(2)}`}
                change={costChange.value}
                isPositive={!costChange.isPositive}
                color="bg-emerald-500"
            />
            <KpiCard
                title="Tasa de Exito"
                value={`${kpis.successRate}%`}
                change="Este mes"
                isPositive={kpis.successRate >= 80}
                color="bg-pink-500"
            />
        </div>
    );
}

function KpiCard({ title, value, change, isPositive, color }: any) {
    return (
        <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-current/20 text-white font-bold text-xl", color)}>
                        {title.charAt(0)}
                    </div>
                    <div className={cn("text-xs font-bold px-2 py-1 rounded-full",
                        isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                        {change}
                    </div>
                </div>
                <div>
                    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
                    <div className="text-3xl font-bold text-slate-800">{value}</div>
                </div>
            </CardContent>
        </Card>
    );
}
