"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

type ViewMode = 'daily' | 'weekly' | 'monthly';
type ComparisonMode = 'none' | 'previousPeriod' | 'custom';

interface Call {
    id: string;
    start_timestamp: string;
    duration_seconds: number;
    user_sentiment: string | null;
    call_successful: boolean;
    client_id: string;
}

interface ChartDataPoint {
    date: string;
    calls: number;
    minutes: number;
    avgMinutes: number;
    transfers: number;
    positive: number;
    neutral: number;
    negative: number;
    compCalls?: number;
    compMinutes?: number;
    compTransfers?: number;
}

interface AnalyticsChartsProps {
    clientId: string;
    startDate: Date;
    endDate: Date;
    viewMode: ViewMode;
    comparisonMode: ComparisonMode;
    comparisonStart?: Date;
    comparisonEnd?: Date;
}

export default function AnalyticsCharts({
    clientId,
    startDate,
    endDate,
    viewMode,
    comparisonMode,
    comparisonStart,
    comparisonEnd,
}: AnalyticsChartsProps) {
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [sentimentTotal, setSentimentTotal] = useState({ positive: 0, neutral: 0, negative: 0 });

    useEffect(() => {
        fetchAndAggregateData();
    }, [clientId, startDate, endDate, viewMode, comparisonMode, comparisonStart, comparisonEnd]);

    const fetchAndAggregateData = async () => {
        setLoading(true);

        // Fetch main period data
        const { data: calls, error } = await supabase
            .from('calls')
            .select('*')
            .eq('client_id', clientId)
            .gte('start_timestamp', startDate.toISOString())
            .lte('start_timestamp', endDate.toISOString())
            .order('start_timestamp');

        if (error) {
            console.error('Error fetching calls:', error);
            setLoading(false);
            return;
        }

        // Fetch comparison period data if needed
        let comparisonCalls: Call[] = [];
        if (comparisonMode !== 'none' && comparisonStart && comparisonEnd) {
            const { data: compData } = await supabase
                .from('calls')
                .select('*')
                .eq('client_id', clientId)
                .gte('start_timestamp', comparisonStart.toISOString())
                .lte('start_timestamp', comparisonEnd.toISOString())
                .order('start_timestamp');

            comparisonCalls = compData || [];
        }

        // Aggregate data based on view mode
        const aggregated = aggregateByViewMode(calls || [], viewMode, startDate, endDate);
        const compAggregated = comparisonCalls.length > 0
            ? aggregateByViewMode(comparisonCalls, viewMode, comparisonStart!, comparisonEnd!)
            : [];

        // Merge comparison data
        const merged = aggregated.map((point, index) => ({
            ...point,
            compCalls: compAggregated[index]?.calls,
            compMinutes: compAggregated[index]?.minutes,
            compTransfers: compAggregated[index]?.transfers,
        }));

        setChartData(merged);

        // Calculate overall sentiment totals
        const sentiments = (calls || []).reduce(
            (acc, call) => {
                const sentiment = call.user_sentiment?.toLowerCase() || 'neutral';
                if (sentiment.includes('positive') || sentiment.includes('positivo')) acc.positive++;
                else if (sentiment.includes('negative') || sentiment.includes('negativo')) acc.negative++;
                else acc.neutral++;
                return acc;
            },
            { positive: 0, neutral: 0, negative: 0 }
        );

        setSentimentTotal(sentiments);
        setLoading(false);
    };

    const aggregateByViewMode = (calls: Call[], mode: ViewMode, start: Date, end: Date): ChartDataPoint[] => {
        let intervals: Date[] = [];
        let formatString = '';

        if (mode === 'daily') {
            intervals = eachDayOfInterval({ start, end });
            formatString = 'd MMM';
        } else if (mode === 'weekly') {
            intervals = eachWeekOfInterval({ start, end }).map(date => startOfWeek(date));
            formatString = "'Sem' w";
        } else {
            intervals = eachMonthOfInterval({ start, end }).map(date => startOfMonth(date));
            formatString = 'MMM yyyy';
        }

        return intervals.map((date) => {
            let periodEnd: Date;
            if (mode === 'daily') {
                periodEnd = date;
            } else if (mode === 'weekly') {
                periodEnd = endOfWeek(date);
            } else {
                periodEnd = endOfMonth(date);
            }

            const periodCalls = calls.filter((call) => {
                const callDate = parseISO(call.start_timestamp);
                return callDate >= date && callDate <= periodEnd;
            });

            const totalMinutes = periodCalls.reduce((sum, call) => sum + (call.duration_seconds / 60), 0);
            const avgMinutes = periodCalls.length > 0 ? totalMinutes / periodCalls.length : 0;

            // Count transfers (assuming call_successful means transfer was successful)
            // TODO: Add actual transfer field to database
            const transfers = periodCalls.filter(call => call.call_successful).length;

            // Count sentiments for this period
            const sentiments = periodCalls.reduce(
                (acc, call) => {
                    const sentiment = call.user_sentiment?.toLowerCase() || 'neutral';
                    if (sentiment.includes('positive') || sentiment.includes('positivo')) acc.positive++;
                    else if (sentiment.includes('negative') || sentiment.includes('negativo')) acc.negative++;
                    else acc.neutral++;
                    return acc;
                },
                { positive: 0, neutral: 0, negative: 0 }
            );

            return {
                date: format(date, formatString, { locale: es }),
                calls: periodCalls.length,
                minutes: Math.round(totalMinutes),
                avgMinutes: Math.round(avgMinutes * 10) / 10,
                transfers,
                positive: sentiments.positive,
                neutral: sentiments.neutral,
                negative: sentiments.negative,
            };
        });
    };

    const sentimentData = [
        { name: 'Positivo', value: sentimentTotal.positive, color: '#67B7AF' },
        { name: 'Neutro', value: sentimentTotal.neutral, color: '#008DCB' },
        { name: 'Negativo', value: sentimentTotal.negative, color: '#F78E5E' },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {[1, 2].map((i) => (
                    <Card key={i} className="border-white/5 shadow-2xl rounded-3xl overflow-hidden bg-surface-dark p-6 animate-pulse">
                        <div className="h-6 bg-white/5 rounded w-1/3 mb-8"></div>
                        <div className="h-[300px] bg-white/5 rounded"></div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calls Volume Chart */}
            <Card className="border-white/5 shadow-2xl rounded-3xl overflow-hidden bg-surface-dark p-6">
                <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <p className="text-accent-blue font-mono text-[10px] uppercase tracking-widest font-bold mb-1">Volumen de Llamadas</p>
                        <CardTitle className="text-2xl font-bold font-header tracking-tight text-white">Llamadas Totales</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#008DCB" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#008DCB" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                stroke="rgba(255,255,255,0.1)"
                                fontSize={10}
                                tick={{ fill: 'rgba(255,255,255,0.4)' }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                                className="font-mono"
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.1)"
                                fontSize={10}
                                tick={{ fill: 'rgba(255,255,255,0.4)' }}
                                axisLine={false}
                                tickLine={false}
                                className="font-mono"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#16191E',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    color: '#FFF'
                                }}
                                itemStyle={{ color: '#008DCB' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="calls"
                                stroke="#008DCB"
                                strokeWidth={3}
                                fill="url(#callsGradient)"
                                name="Llamadas"
                                animationDuration={1000}
                            />
                            {comparisonMode !== 'none' && (
                                <Area type="monotone" dataKey="compCalls" stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeDasharray="5 5" fill="none" name="Anterior" />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Sentiment Analysis Chart */}
            <Card className="border-white/5 shadow-2xl rounded-3xl overflow-hidden bg-surface-dark p-6">
                <CardHeader className="p-0 mb-8">
                    <p className="text-accent-mineral font-mono text-[10px] uppercase tracking-widest font-bold mb-1">Sentimiento del usuario</p>
                    <CardTitle className="text-2xl font-bold font-header tracking-tight text-white">Análisis Global</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-full md:w-1/2 h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sentimentData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                    animationBegin={200}
                                >
                                    {sentimentData.map((entry: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            stroke="none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#16191E',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/2 space-y-4">
                        {sentimentData.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">{item.name}</span>
                                </div>
                                <span className="text-sm font-bold font-mono text-white">
                                    {((item.value / (sentimentTotal.positive + sentimentTotal.neutral + sentimentTotal.negative || 1)) * 100).toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Minutes & Transfers Row */}
            <Card className="border-white/5 shadow-2xl rounded-3xl overflow-hidden bg-surface-dark p-6 lg:col-span-2">
                <CardHeader className="p-0 mb-8">
                    <p className="text-accent-coral font-mono text-[10px] uppercase tracking-widest font-bold mb-1">Rendimiento Operativo</p>
                    <CardTitle className="text-2xl font-bold font-header tracking-tight text-white">Minutos y Transferencias</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="rgba(255,255,255,0.1)"
                                fontSize={10}
                                tick={{ fill: 'rgba(255,255,255,0.4)' }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                                className="font-mono"
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.1)"
                                fontSize={10}
                                tick={{ fill: 'rgba(255,255,255,0.4)' }}
                                axisLine={false}
                                tickLine={false}
                                className="font-mono"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#16191E',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px'
                                }}
                            />
                            <Bar dataKey="minutes" fill="#008DCB" radius={[4, 4, 0, 0]} barSize={20} name="Minutos" />
                            <Bar dataKey="transfers" fill="#F78E5E" radius={[4, 4, 0, 0]} barSize={20} name="Transferencias" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

const sentimentDataConfig = (totals: any) => [
    { name: 'Positivo', value: totals.positive, color: '#67B7AF' },
    { name: 'Neutro', value: totals.neutral, color: '#008DCB' },
    { name: 'Negativo', value: totals.negative, color: '#F78E5E' },
];
