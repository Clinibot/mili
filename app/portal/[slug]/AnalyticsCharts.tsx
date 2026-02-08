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
    start_timestamp: string | number;
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
            .gte('start_timestamp', startDate.getTime())
            .lte('start_timestamp', endDate.getTime())
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
                .gte('start_timestamp', comparisonStart.getTime())
                .lte('start_timestamp', comparisonEnd.getTime())
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
                const callDate = new Date(Number(call.start_timestamp));
                return callDate >= date && callDate <= periodEnd;
            });

            const totalMinutes = periodCalls.reduce((sum, call) => sum + ((call.duration_seconds || 0) / 60), 0);
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
                    <Card key={i} className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white p-8 animate-pulse">
                        <div className="h-6 bg-slate-100 rounded w-1/3 mb-8"></div>
                        <div className="h-[300px] bg-slate-50 rounded"></div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calls Volume Chart */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white p-8">
                <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <p className="text-blue-600 font-sans text-[10px] uppercase tracking-widest font-bold mb-1">Volumen de Llamadas</p>
                        <CardTitle className="text-2xl font-black font-header tracking-tight text-slate-900">Llamadas Totales</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                stroke="#e2e8f0"
                                fontSize={10}
                                tick={{ fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                                className="font-sans"
                            />
                            <YAxis
                                stroke="#e2e8f0"
                                fontSize={10}
                                tick={{ fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                                className="font-sans"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #f1f5f9',
                                    borderRadius: '16px',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                                    fontSize: '12px',
                                    color: '#1e293b'
                                }}
                                itemStyle={{ color: '#2563eb' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="calls"
                                stroke="#2563eb"
                                strokeWidth={4}
                                fill="url(#callsGradient)"
                                name="Llamadas"
                                animationDuration={1000}
                                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                            {comparisonMode !== 'none' && (
                                <Area type="monotone" dataKey="compCalls" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" fill="none" name="Anterior" />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Sentiment Analysis Chart */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white p-8">
                <CardHeader className="p-0 mb-8">
                    <p className="text-emerald-600 font-sans text-[10px] uppercase tracking-widest font-bold mb-1">Sentimiento del usuario</p>
                    <CardTitle className="text-2xl font-black font-header tracking-tight text-slate-900">Análisis Global</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-full md:w-1/2 h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sentimentData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
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
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #f1f5f9',
                                        borderRadius: '16px',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/2 space-y-4">
                        {sentimentData.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between group p-3 rounded-2xl transition-colors hover:bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-wider">{item.name}</span>
                                </div>
                                <span className="text-sm font-black text-slate-900">
                                    {((item.value / (sentimentTotal.positive + sentimentTotal.neutral + sentimentTotal.negative || 1)) * 100).toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Minutes & Transfers Row */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white p-8 lg:col-span-2">
                <CardHeader className="p-0 mb-8">
                    <p className="text-purple-600 font-sans text-[10px] uppercase tracking-widest font-bold mb-1">Rendimiento Operativo</p>
                    <CardTitle className="text-2xl font-black font-header tracking-tight text-slate-900">Minutos y Transferencias</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#e2e8f0"
                                fontSize={10}
                                tick={{ fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                                className="font-sans"
                            />
                            <YAxis
                                stroke="#e2e8f0"
                                fontSize={10}
                                tick={{ fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                                className="font-sans"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #f1f5f9',
                                    borderRadius: '16px',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)'
                                }}
                            />
                            <Bar dataKey="minutes" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={24} name="Minutos" />
                            <Bar dataKey="transfers" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={24} name="Transferencias" />
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
