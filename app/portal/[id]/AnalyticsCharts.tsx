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
        { name: 'Positivas', value: sentimentTotal.positive, color: '#10B981' },
        { name: 'Neutras', value: sentimentTotal.neutral, color: '#6B7280' },
        { name: 'Negativas', value: sentimentTotal.negative, color: '#EF4444' },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="border-slate-100 shadow-sm bg-white">
                        <CardHeader>
                            <div className="h-6 bg-slate-200 rounded animate-pulse w-1/3"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 bg-slate-100 rounded animate-pulse"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calls Volume Chart */}
            <Card className="border-slate-100 shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-800">Volumen de Llamadas</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.2} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                            <YAxis stroke="#64748B" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="calls" stroke="#3B82F6" strokeWidth={2} fill="url(#callsGradient)" name="Llamadas" />
                            {comparisonMode !== 'none' && (
                                <Area type="monotone" dataKey="compCalls" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" fill="none" name="Comparación" />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Minutes Consumed Chart */}
            <Card className="border-slate-100 shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-800">Minutos Consumidos</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="minutesGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0.2} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                            <YAxis stroke="#64748B" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                            <Area type="monotone" dataKey="minutes" stroke="#8B5CF6" strokeWidth={2} fill="url(#minutesGradient)" name="Minutos" />
                            <Line type="monotone" dataKey="avgMinutes" stroke="#EC4899" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Media/llamada" />
                            {comparisonMode !== 'none' && (
                                <Area type="monotone" dataKey="compMinutes" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" fill="none" name="Comparación" />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Transfers Chart */}
            <Card className="border-slate-100 shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-800">Transferencias Realizadas</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <defs>
                                <linearGradient id="transfersGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.9} />
                                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.7} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                            <YAxis stroke="#64748B" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                            <Bar dataKey="transfers" fill="url(#transfersGradient)" radius={[8, 8, 0, 0]} name="Transferencias" />
                            {comparisonMode !== 'none' && (
                                <Bar dataKey="compTransfers" fill="#CBD5E1" radius={[8, 8, 0, 0]} name="Comparación" />
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Sentiment Analysis Chart */}
            <Card className="border-slate-100 shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-800">Análisis de Sentimiento</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={sentimentData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => `${entry.name}: ${entry.value}`}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {sentimentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold" style={{ color: '#10B981' }}>{sentimentTotal.positive}</div>
                            <div className="text-xs text-slate-600">Positivas</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold" style={{ color: '#6B7280' }}>{sentimentTotal.neutral}</div>
                            <div className="text-xs text-slate-600">Neutras</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold" style={{ color: '#EF4444' }}>{sentimentTotal.negative}</div>
                            <div className="text-xs text-slate-600">Negativas</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
