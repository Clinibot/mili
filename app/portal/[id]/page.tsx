"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
                    <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
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
                        color="bg-blue-500"
                    />
                    <KpiCard
                        title="Minutos Consumidos"
                        value="3,820"
                        change="+5.2%"
                        isPositive={true}
                        color="bg-purple-500"
                    />
                    <KpiCard
                        title="Coste Estimado"
                        value="€458.00"
                        change="-2.1%"
                        isPositive={true}
                        color="bg-emerald-500"
                    />
                    <KpiCard
                        title="Satisfacción IA"
                        value="98%"
                        change="+1.0%"
                        isPositive={true}
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
                            <CallsList clientId={id} />
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

function CallsList({ clientId }: { clientId: string }) {
    const [calls, setCalls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCall, setExpandedCall] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCalls() {
            const { data, error } = await supabase
                .from('calls')
                .select('*')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) setCalls(data);
            setLoading(false);
        }
        fetchCalls();
    }, [clientId]);

    if (loading) return <div className="p-6 text-center text-slate-400">Cargando llamadas...</div>;
    if (calls.length === 0) return <div className="p-6 text-center text-slate-400">No hay llamadas registradas.</div>;

    return (
        <div>
            {calls.map((call) => (
                <div key={call.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <div
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm font-bold text-lg ${call.user_sentiment === 'Positive' ? 'bg-emerald-500' :
                                call.user_sentiment === 'Negative' ? 'bg-red-500' : 'bg-slate-400'
                                }`}>
                                {call.from_number ? call.from_number.charAt(call.from_number.length - 1) : '?'}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">{call.from_number || 'Desconocido'}</p>
                                <p className="text-xs text-slate-400">{new Date(call.start_timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-xs font-bold text-slate-700">
                                {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : '0s'}
                            </span>
                            <span className={`text-[10px] font-medium ${call.call_successful ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {call.call_status}
                            </span>
                        </div>
                    </div>

                    {expandedCall === call.id && (
                        <div className="bg-slate-50/50 p-4 pt-0 text-sm space-y-3 animate-in slide-in-from-top-2">
                            {/* Summary */}
                            {call.call_summary && (
                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                    <p className="font-semibold text-slate-700 mb-1">Resumen</p>
                                    <p className="text-slate-600 text-xs leading-relaxed">{call.call_summary}</p>
                                </div>
                            )}

                            {/* Recording */}
                            {call.recording_url && (
                                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                    <p className="font-semibold text-slate-700 mb-2">Grabación</p>
                                    <audio controls src={call.recording_url} className="w-full h-8" />
                                </div>
                            )}

                            {/* Transcript */}
                            {call.transcript && (
                                <details className="group">
                                    <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors list-none">
                                        Ver Transcripción Completa
                                    </summary>
                                    <div className="mt-2 p-3 bg-white rounded-xl border border-slate-100 text-xs text-slate-600 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                        {call.transcript}
                                    </div>
                                </details>
                            )}

                            {/* Custom Data */}
                            {call.custom_analysis_data && Object.keys(call.custom_analysis_data).length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {Object.entries(call.custom_analysis_data).map(([key, value]) => (
                                        <div key={key} className="bg-white p-2 rounded-lg border border-slate-100">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">{key.replace(/_/g, ' ')}</p>
                                            <p className="text-xs text-slate-700 font-medium truncate" title={String(value)}>{String(value)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
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
                    <div className={cn("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                        isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                        {isPositive ? "↗" : "↘"}
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
