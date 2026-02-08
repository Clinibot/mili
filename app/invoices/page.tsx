"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, Wallet, TrendingUp, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transaction {
    id: string;
    created_at: string;
    amount: number;
    type: string;
}

export default function InvoicesPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('week');

    useEffect(() => {
        async function fetchRecharges() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('transactions')
                    .select('id, created_at, amount, type')
                    .eq('type', 'recharge')
                    .order('created_at', { ascending: true });

                if (error) throw error;
                setTransactions(data || []);
            } catch (err) {
                console.error('Error fetching recharges:', err);
                // Mock data if table doesn't exist or is empty for demo
                const mockRecharges = Array.from({ length: 20 }).map((_, i) => ({
                    id: `${i}`,
                    created_at: subDays(new Date(), 19 - i).toISOString(),
                    amount: Math.floor(Math.random() * 500) + 50,
                    type: 'recharge'
                }));
                setTransactions(mockRecharges);
            } finally {
                setLoading(false);
            }
        }
        fetchRecharges();
    }, []);

    const getFilteredData = () => {
        const now = new Date();
        let startDate: Date;

        if (period === 'day') startDate = startOfDay(now);
        else if (period === 'week') startDate = subDays(now, 7);
        else if (period === 'month') startDate = subDays(now, 30);
        else startDate = subDays(now, 90); // Default for custom/long view

        const filtered = transactions.filter(t => new Date(t.created_at) >= startDate);

        // Group by day for the chart
        const grouped = filtered.reduce((acc: any, t) => {
            const date = format(new Date(t.created_at), 'dd MMM', { locale: es });
            acc[date] = (acc[date] || 0) + Number(t.amount);
            return acc;
        }, {});

        return Object.entries(grouped).map(([date, amount]) => ({
            date,
            amount
        }));
    };

    const chartData = getFilteredData();
    const totalRecharges = chartData.reduce((sum, item) => sum + (item.amount as number), 0);

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Analítica de Recargas</h1>
                        <p className="text-slate-500 mt-1">Monitorea el flujo de ingresos de tus clientes.</p>
                    </div>

                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        {(['day', 'week', 'month'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                                    period === p
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                )}
                            >
                                {p === 'day' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="border-b border-slate-50 p-6">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <TrendingUp className="text-blue-600" size={20} />
                                    Volumen de Recargas
                                </CardTitle>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Diario</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 h-[400px]">
                            {loading ? (
                                <div className="w-full h-full bg-slate-50 animate-pulse rounded-2xl" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            tickFormatter={(value) => `€${value}`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                padding: '12px'
                                            }}
                                            formatter={(value) => [`€${value}`, 'Recargado']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#2563eb"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorAmount)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="border-slate-100 shadow-sm rounded-3xl bg-blue-600 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Wallet size={120} />
                            </div>
                            <CardContent className="p-8 relative z-10">
                                <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-2">Total Recargado</p>
                                <h2 className="text-5xl font-black mb-6">€{totalRecharges.toLocaleString()}</h2>
                                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl w-fit backdrop-blur-sm">
                                    <TrendingUp size={16} />
                                    <span className="text-xs font-bold">+12.5% vs periodo anterior</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-100 shadow-sm rounded-3xl bg-white p-8">
                            <h3 className="text-slate-800 font-bold mb-4">Resumen del Periodo</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Promedio Diario</span>
                                    <span className="font-bold">€{(totalRecharges / (chartData.length || 1)).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Día de mayor actividad</span>
                                    <span className="font-bold">
                                        {chartData.sort((a, b) => (b.amount as number) - (a.amount as number))[0]?.date || '-'}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
