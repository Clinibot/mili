"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Clock, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Client {
    id: string;
    name: string;
    phone_ia: string;
    contact_name: string;
}

export default function ClientPortal() {
    const params = useParams();
    const id = params?.id as string;
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        async function fetchClient() {
            try {
                const { data, error } = await supabase
                    .from('clients')
                    .select('id, name, phone_ia, contact_name')
                    .eq('id', id)
                    .single();

                if (data) setClient(data);
            } catch (err) {
                console.error("Error fetching client", err);
            } finally {
                setLoading(false);
            }
        }
        fetchClient();
    }, [id]);

    if (loading) {
        return <div className="min-h-screen bg-[#0F1115] flex items-center justify-center text-white">Cargando panel...</div>;
    }

    if (!client) {
        return <div className="min-h-screen bg-[#0F1115] flex items-center justify-center text-white">Cliente no encontrado.</div>;
    }

    return (
        <div className="min-h-screen bg-[#0F1115] text-white font-sans selection:bg-blue-500/30">
            {/* Navbar Simplified */}
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 lg:px-12 bg-[#0F1115]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        IA para llamadas
                    </span>
                    <span className="text-white/20">|</span>
                    <span className="text-sm text-slate-400">{client.name}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-white">{client.contact_name}</p>
                        <p className="text-xs text-slate-500">Cliente</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-xs font-bold border-2 border-[#0F1115]">
                        {client.contact_name?.charAt(0) || 'C'}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 lg:p-12 space-y-8 relative">
                {/* Decorative Background */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] pointer-events-none rounded-full -translate-y-1/2"></div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard
                        title="Llamadas Totales"
                        value="1,245"
                        change="+12.5%"
                        isPositive={true}
                        icon={<Phone size={20} className="text-blue-400" />}
                    />
                    <KpiCard
                        title="Minutos Consumidos"
                        value="3,820"
                        change="+5.2%"
                        isPositive={true}
                        icon={<Clock size={20} className="text-purple-400" />}
                    />
                    <KpiCard
                        title="Coste Estimado"
                        value="€458.00"
                        change="-2.1%"
                        isPositive={true}
                        icon={<DollarSign size={20} className="text-emerald-400" />}
                    />
                    <KpiCard
                        title="Satisfacción IA"
                        value="98%"
                        change="+1.0%"
                        isPositive={true}
                        icon={<Activity size={20} className="text-pink-400" />}
                    />
                </div>

                {/* Big Chart Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 min-h-[400px]">
                        <CardHeader>
                            <CardTitle>Actividad de Llamadas</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-[320px] text-slate-500">
                            {/* Placeholder for Chart */}
                            <div className="w-full h-full bg-white/5 rounded-lg flex items-center justify-center border border-dashed border-white/10 uppercase text-xs tracking-widest">
                                Gráfico de Actividad (Próximamente)
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Calls List */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Últimas Llamadas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2, 3, 4, 5].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                            <Phone size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">+34 600...{i}23</p>
                                            <p className="text-xs text-slate-500">Hace {i * 15 + 5} min</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono text-slate-400">4m 12s</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

function KpiCard({ title, value, change, isPositive, icon }: any) {
    return (
        <Card className="hover:bg-white/10 transition-colors duration-300">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                        {icon}
                    </div>
                    <div className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                        isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    )}>
                        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {change}
                    </div>
                </div>
                <div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
                    <div className="text-2xl font-bold text-white">{value}</div>
                </div>
            </CardContent>
        </Card>
    );
}
