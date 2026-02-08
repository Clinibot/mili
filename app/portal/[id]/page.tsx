"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Clock, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Activity, MoreHorizontal, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';

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
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Cargando panel...</div>;
    }

    if (!client) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Cliente no encontrado.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
            <Toaster />
            {/* Navbar Simplified */}
            <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/20">
                        IA
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 leading-tight">Panel de Control</h1>
                        <p className="text-xs text-slate-500">Vista de Cliente</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-800">{client.name}</p>
                        <p className="text-xs text-slate-500">{client.contact_name}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-medium">
                        {client.contact_name?.charAt(0) || 'C'}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 lg:p-12 space-y-8">

                {/* Header Welcome */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900">Resumen General</h2>
                        <p className="text-slate-500 mt-1">Métricas y actividad recente de tu agente IA.</p>
                    </div>
                    <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                        <Download size={16} />
                        Descargar Reporte
                    </button>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard
                        title="Llamadas Totales"
                        value="1,245"
                        change="+12.5%"
                        isPositive={true}
                        icon={<Phone size={24} className="text-white" />}
                        color="bg-blue-500"
                    />
                    <KpiCard
                        title="Minutos Consumidos"
                        value="3,820"
                        change="+5.2%"
                        isPositive={true}
                        icon={<Clock size={24} className="text-white" />}
                        color="bg-purple-500"
                    />
                    <KpiCard
                        title="Coste Estimado"
                        value="€458.00"
                        change="-2.1%"
                        isPositive={true}
                        icon={<DollarSign size={24} className="text-white" />}
                        color="bg-emerald-500"
                    />
                    <KpiCard
                        title="Satisfacción IA"
                        value="98%"
                        change="+1.0%"
                        isPositive={true}
                        icon={<Activity size={24} className="text-white" />}
                        color="bg-pink-500"
                    />
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Chart Section */}
                    <Card className="lg:col-span-2 border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                        <CardHeader className="border-b border-slate-50 pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-bold text-slate-800">Actividad de Llamadas</CardTitle>
                                <select className="bg-slate-50 border-none text-xs font-medium text-slate-500 rounded-lg px-2 py-1 outline-none cursor-pointer">
                                    <option>Últimos 7 días</option>
                                    <option>Este mes</option>
                                </select>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="h-[300px] w-full bg-gradient-to-b from-blue-50/50 to-transparent rounded-xl border border-blue-100 border-dashed flex items-center justify-center text-blue-300 font-medium">
                                GRÁFICO DE ACTIVIDAD
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Calls List */}
                    <Card className="lg:col-span-1 border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                        <CardHeader className="border-b border-slate-50 pb-4">
                            <CardTitle className="text-lg font-bold text-slate-800">Últimas Llamadas</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {[1, 2, 3, 4, 5].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0 group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                            <Phone size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">+34 600...{i}23</p>
                                            <p className="text-xs text-slate-400">Hace {i * 15 + 5} min</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xs font-bold text-slate-700">4m 12s</span>
                                        <span className="text-[10px] text-emerald-500 font-medium">Completada</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

function KpiCard({ title, value, change, isPositive, icon, color }: any) {
    return (
        <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-current/20", color)}>
                        {icon}
                    </div>
                    <div className={cn("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                        isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
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
