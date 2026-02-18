"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import {
    format,
    eachDayOfInterval,
    eachWeekOfInterval,
    eachMonthOfInterval,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    endOfDay
} from 'date-fns';
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
    custom_analysis_data?: any;
}

interface ChartConfig {
    id: string;
    name: string;
    chart_type: 'bar' | 'area' | 'pie' | 'line' | 'dist-bar' | 'list';
    data_field: string;
    calculation: string;
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
    [key: string]: any;
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
    const [hourlyData, setHourlyData] = useState<{ hour: string; calls: number }[]>([]);
    const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>([]);
    const [categoricalData, setCategoricalData] = useState<Record<string, { name: string, value: number, color: string }[]>>({});
    const [loading, setLoading] = useState(true);
    const [sentimentTotal, setSentimentTotal] = useState({ positive: 0, neutral: 0, negative: 0 });

    useEffect(() => {
        fetchAndAggregateData();
    }, [clientId, startDate, endDate, viewMode, comparisonMode, comparisonStart, comparisonEnd]);

    const fetchAndAggregateData = async () => {
        setLoading(true);

        const msEnd = endOfDay(endDate).getTime();

        const { data: calls, error } = await supabase
            .from('calls')
            .select('*, custom_analysis_data')
            .eq('client_id', clientId)
            .gte('start_timestamp', startDate.getTime())
            .lte('start_timestamp', msEnd)
            .order('start_timestamp');

        if (error) {
            console.error('Error fetching calls:', error);
            setLoading(false);
            return;
        }

        const { data: configs } = await supabase
            .from('client_analytics_configs')
            .select('*')
            .eq('client_id', clientId)
            .eq('type', 'chart')
            .eq('is_active', true);

        setChartConfigs(configs || []);

        const aggregated = aggregateByViewMode(calls || [], viewMode, startDate, endDate, configs || []);
        setChartData(aggregated);

        // Categorical Aggregation for Pie, Dist-Bar, and List Charts
        const categorical: Record<string, { name: string, value: number, color: string }[]> = {};
        const colors = ['#008DCB', '#67B7AF', '#F78E5E', '#E8ECF1', '#1F2937'];

        (configs || []).forEach(config => {
            if (['pie', 'dist-bar', 'list'].includes(config.chart_type)) {
                const field = config.data_field;
                const counts: Record<string, number> = {};
                const recentValues: Set<string> = new Set();

                // For 'list', we might want chronological order, but counts are also useful
                (calls || []).forEach(call => {
                    let data = call.custom_analysis_data;
                    if (typeof data === 'string') {
                        try { data = JSON.parse(data); } catch (e) { data = {}; }
                    }

                    if (!data) return;

                    // Try direct match, then lowercase/underscore match
                    let val = data[field];
                    if (val === undefined) {
                        const normalizedField = field.toLowerCase().replace(/\s+/g, '_');
                        val = Object.entries(data).find(([k]) =>
                            k.toLowerCase().replace(/\s+/g, '_') === normalizedField
                        )?.[1];
                    }

                    if (val !== undefined && val !== null && val !== '') {
                        const label = String(val);
                        counts[label] = (counts[label] || 0) + 1;
                    }
                });

                categorical[config.id] = Object.entries(counts).map(([name, value], i) => ({
                    name,
                    value,
                    color: colors[i % colors.length]
                })).sort((a, b) => b.value - a.value);
            }
        });
        setCategoricalData(categorical);

        // Hourly Distribution
        const hourly = Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}:00`,
            calls: 0
        }));
        (calls || []).forEach(call => {
            const hour = new Date(Number(call.start_timestamp)).getHours();
            hourly[hour].calls++;
        });
        setHourlyData(hourly);

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

    const aggregateByViewMode = (calls: Call[], mode: ViewMode, start: Date, end: Date, configs: ChartConfig[]): ChartDataPoint[] => {
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
            if (mode === 'daily') periodEnd = endOfDay(date);
            else if (mode === 'weekly') periodEnd = endOfWeek(date);
            else periodEnd = endOfMonth(date);

            const periodCalls = calls.filter((call) => {
                const callDate = new Date(Number(call.start_timestamp));
                return callDate >= date && callDate <= periodEnd;
            });

            const totalMinutes = periodCalls.reduce((sum, call) => sum + ((call.duration_seconds || 0) / 60), 0);
            const transfers = periodCalls.filter(call => call.call_successful).length;

            const baseData = {
                date: format(date, formatString, { locale: es }),
                calls: periodCalls.length,
                minutes: Number(totalMinutes.toFixed(2)),
                avgMinutes: periodCalls.length > 0 ? (totalMinutes / periodCalls.length) : 0,
                transfers,
                positive: 0,
                neutral: 0,
                negative: 0,
            };

            const customData: Record<string, number> = {};
            configs.forEach(config => {
                const field = config.data_field;
                const validCalls = periodCalls.filter(c => c.custom_analysis_data && c.custom_analysis_data[field] !== undefined);
                let val = 0;
                if (config.calculation === 'count') val = validCalls.filter(c => !!c.custom_analysis_data?.[field]).length;
                else if (config.calculation === 'sum') val = validCalls.reduce((s, c) => s + (Number(c.custom_analysis_data?.[field]) || 0), 0);
                else if (config.calculation === 'avg') {
                    const sum = validCalls.reduce((s, c) => s + (Number(c.custom_analysis_data?.[field]) || 0), 0);
                    val = validCalls.length > 0 ? sum / validCalls.length : 0;
                }
                customData[field] = val;
            });

            return { ...baseData, ...customData };
        });
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Hourly Distribution Chart */}
                <Card className="border-[#1F2937] shadow-xl shadow-black/20 rounded-xl overflow-hidden bg-[#0E1219] p-8">
                    <CardHeader className="p-0 mb-8">
                        <p className="text-[#008DCB] font-sans text-[10px] uppercase tracking-widest font-bold mb-1">Distribución Horaria</p>
                        <CardTitle className="text-2xl font-black font-header tracking-tight text-[#E8ECF1]">Llamadas por horas</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={hourlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.1)" fontSize={10} tick={{ fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.1)" fontSize={10} tick={{ fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#0E1219', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                <Bar dataKey="calls" fill="#008DCB" radius={[4, 4, 0, 0]} name="Llamadas" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Sentiment Analysis Chart */}
                <Card className="border-[#1F2937] shadow-xl shadow-black/20 rounded-xl overflow-hidden bg-[#0E1219] p-8">
                    <CardHeader className="p-0 mb-8">
                        <p className="text-[#67B7AF] font-sans text-[10px] uppercase tracking-widest font-bold mb-1">Sentimiento del usuario</p>
                        <CardTitle className="text-2xl font-black font-header tracking-tight text-[#E8ECF1]">Análisis Global</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-full md:w-1/2 h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Positivo', value: sentimentTotal.positive, color: '#67B7AF' },
                                            { name: 'Neutro', value: sentimentTotal.neutral, color: '#008DCB' },
                                            { name: 'Negativo', value: sentimentTotal.negative, color: '#F78E5E' },
                                        ]}
                                        cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value"
                                    >
                                        <Cell fill="#67B7AF" />
                                        <Cell fill="#008DCB" />
                                        <Cell fill="#F78E5E" />
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#0E1219', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full md:w-1/2 space-y-4">
                            {['Positivo', 'Neutro', 'Negativo'].map((name, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#141A23] transition-colors">
                                    <span className="text-sm font-bold text-[rgba(255,255,255,0.55)] uppercase tracking-wider">{name}</span>
                                    <span className="text-sm font-black text-[#E8ECF1]">
                                        {i === 0 ? sentimentTotal.positive : i === 1 ? sentimentTotal.neutral : sentimentTotal.negative}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calls Volume Chart */}
                <Card className="border-[#1F2937] shadow-xl shadow-black/20 rounded-xl overflow-hidden bg-[#0E1219] p-8">
                    <CardHeader className="p-0 mb-8">
                        <p className="text-[#008DCB] font-sans text-[10px] uppercase tracking-widest font-bold mb-1">Volumen Temporal</p>
                        <CardTitle className="text-2xl font-black font-header tracking-tight text-[#E8ECF1]">Llamadas Totales</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#008DCB" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#008DCB" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" fontSize={10} tick={{ fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis stroke="rgba(255,255,255,0.1)" fontSize={10} tick={{ fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#0E1219', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                <Area type="monotone" dataKey="calls" stroke="#008DCB" strokeWidth={4} fill="url(#callsGradient)" name="Llamadas" dot={{ fill: '#008DCB', strokeWidth: 2, r: 4, stroke: '#0E1219' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Custom Charts based on configs */}
                {chartConfigs.map((config) => (
                    <Card key={config.id} className="border-[#1F2937] shadow-xl shadow-black/20 rounded-xl overflow-hidden bg-[#0E1219] p-8">
                        <CardHeader className="p-0 mb-8">
                            <p className="text-[#008DCB] font-sans text-[10px] uppercase tracking-widest font-bold mb-1">{config.calculation === 'count' ? 'Frecuencia' : 'Acumulado'}</p>
                            <CardTitle className="text-2xl font-black font-header tracking-tight text-[#E8ECF1]">{config.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ResponsiveContainer width="100%" height={300}>
                                {config.chart_type === 'bar' ? (
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" fontSize={10} />
                                        <YAxis stroke="rgba(255,255,255,0.1)" fontSize={10} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0E1219', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                        <Bar dataKey={config.data_field} fill="#008DCB" radius={[4, 4, 0, 0]} name={config.name} />
                                    </BarChart>
                                ) : config.chart_type === 'area' ? (
                                    <AreaChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" fontSize={10} />
                                        <YAxis stroke="rgba(255,255,255,0.1)" fontSize={10} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0E1219', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                        <Area type="monotone" dataKey={config.data_field} stroke="#67B7AF" fill="#67B7AF" fillOpacity={0.1} strokeWidth={3} name={config.name} />
                                    </AreaChart>
                                ) : config.chart_type === 'line' ? (
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" fontSize={10} />
                                        <YAxis stroke="rgba(255,255,255,0.1)" fontSize={10} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0E1219', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                        <Line type="monotone" dataKey={config.data_field} stroke="#F78E5E" strokeWidth={3} dot={{ r: 4 }} name={config.name} />
                                    </LineChart>
                                ) : config.chart_type === 'dist-bar' ? (
                                    <BarChart data={categoricalData[config.id] || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.1)" fontSize={10} tick={{ fill: 'rgba(255,255,255,0.3)' }} />
                                        <YAxis stroke="rgba(255,255,255,0.1)" fontSize={10} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0E1219', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                        <Bar dataKey="value" fill="#008DCB" radius={[4, 4, 0, 0]} name="Ocurrencias" />
                                    </BarChart>
                                ) : config.chart_type === 'list' ? (
                                    <div className="h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {(categoricalData[config.id] || []).map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#141A23] hover:bg-[#1A222C] transition-colors border border-[#1F2937]/50">
                                                <span className="text-xs font-medium text-[#E8ECF1] line-clamp-2 pr-4">{item.name}</span>
                                                <span className="text-[10px] font-black text-[#008DCB] bg-[#008DCB]/10 px-2 py-1 rounded">x{item.value}</span>
                                            </div>
                                        ))}
                                        {(categoricalData[config.id] || []).length === 0 && (
                                            <p className="text-center text-[rgba(255,255,255,0.2)] text-[10px] uppercase font-bold mt-12">No hay datos registrados</p>
                                        )}
                                    </div>
                                ) : (
                                    <PieChart>
                                        <Pie
                                            data={categoricalData[config.id] || []}
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            cx="50%"
                                            cy="50%"
                                        >
                                            {(categoricalData[config.id] || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#0E1219', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                    </PieChart>
                                )}
                            </ResponsiveContainer>
                            {config.chart_type === 'pie' && (
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    {(categoricalData[config.id] || []).slice(0, 6).map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#141A23]">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                                                <span className="text-[10px] text-[rgba(255,255,255,0.5)] truncate">{item.name}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-[#E8ECF1] ml-2">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
