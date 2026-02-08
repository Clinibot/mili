"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import KpiCards from './KpiCards';
import WalletSection from './WalletSection';
import NotificationBell from './NotificationBell';
import DateRangeSelector from './DateRangeSelector';
import AnalyticsCharts from './AnalyticsCharts';
import { subDays } from 'date-fns';

interface Client {
    id: string;
    name: string;
    phone_ia: string;
    contact_name: string;
}

export default function ClientPortal() {
    const params = useParams();
    const slug = params?.slug as string;
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: subDays(new Date(), 6),
        endDate: new Date(),
        viewMode: 'daily' as 'daily' | 'weekly' | 'monthly',
        comparisonMode: 'none' as 'none' | 'previousPeriod' | 'custom',
        comparisonStart: undefined as Date | undefined,
        comparisonEnd: undefined as Date | undefined,
    });
    const [showWallet, setShowWallet] = useState(false);

    useEffect(() => {
        if (!slug) return;
        async function fetchClient() {
            try {
                // Try looking up by ID (UUID) first since slug column is missing in DB
                const isUuid = slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

                let query = supabase.from('clients').select('*');

                if (isUuid) {
                    query = query.eq('id', slug);
                } else {
                    // If slug exists as a column, use it, otherwise this will fail gracefully or we handle it
                    // Given we know it's missing, we only check it if we are sure
                    query = query.or(`id.eq.${slug},name.ilike.%${slug}%`);
                }

                const { data, error } = await query.single();

                if (data) {
                    setClient(data);
                }
            } catch (err) {
                console.error("Error fetching client", err);
            } finally {
                setLoading(false);
            }
        }
        fetchClient();
    }, [slug]);

    if (loading) {
        return <div className="min-h-screen bg-primary-dark flex items-center justify-center text-white/40">Cargando panel...</div>;
    }

    if (!client) {
        return <div className="min-h-screen bg-primary-dark flex items-center justify-center text-white/40">Cliente no encontrado.</div>;
    }

    return (
        <div className="min-h-screen bg-primary-dark text-white font-sans selection:bg-accent-blue/30 flex">
            <Toaster />

            {/* Sidebar */}
            <aside className="w-64 bg-surface-dark border-r border-white/5 flex flex-col sticky top-0 h-screen hidden lg:flex">
                <div className="p-8 border-b border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-accent-blue flex items-center justify-center font-bold text-lg">M</div>
                        <h1 className="font-header text-xl font-bold tracking-tight">MILI</h1>
                    </div>
                    <p className="font-serif text-sm text-accent-blue italic">"La IA que entiende a las pymes"</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-4">
                    <SidebarItem label="Dashboard" active />
                    <SidebarItem label="Llamadas" />
                    <SidebarItem label="Grabaciones" />
                    <SidebarItem label="Pagos" />
                    <SidebarItem label="Métricas" />
                    <SidebarItem label="Configuración" />
                </nav>

                <div className="p-6 mt-auto">
                    <div className="bg-primary-dark/50 rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 font-mono">Saldo Wallet</p>
                        <WalletSection clientId={client.id} />
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                {/* Navbar */}
                <header className="h-20 bg-surface-dark/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <h2 className="font-header text-xl font-bold tracking-tight">Dashboard</h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-accent-mineral">
                            <span className="w-2 h-2 rounded-full bg-accent-mineral animate-pulse"></span>
                            <span className="text-xs font-medium">Agente activo 24/7</span>
                        </div>
                        <NotificationBell clientId={client.id} />
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold">{client.name}</p>
                            <p className="text-xs text-white/40">{client.contact_name}</p>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl w-full mx-auto p-6 lg:p-12 space-y-12">
                    {/* Header Welcome */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <p className="text-accent-blue font-mono text-xs uppercase tracking-[0.2em] mb-2 font-bold">Resumen de actividad</p>
                            <h2 className="font-header text-4xl font-bold tracking-tight">Panel de Control</h2>
                        </div>
                        <div className="flex gap-4">
                            <DateRangeSelector
                                onRangeChange={(start, end, view, comparison, compStart, compEnd) => {
                                    setDateRange({
                                        startDate: start,
                                        endDate: end,
                                        viewMode: view,
                                        comparisonMode: comparison,
                                        comparisonStart: compStart,
                                        comparisonEnd: compEnd,
                                    });
                                }}
                            />
                            <button className="bg-accent-blue hover:bg-accent-blue/80 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-accent-blue/20 active:scale-95">
                                Descargar Reporte
                            </button>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <KpiCards clientId={client.id} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Chart */}
                        <div className="lg:col-span-2">
                            <AnalyticsCharts
                                clientId={client.id}
                                startDate={dateRange.startDate}
                                endDate={dateRange.endDate}
                                viewMode={dateRange.viewMode}
                                comparisonMode={dateRange.comparisonMode}
                                comparisonStart={dateRange.comparisonStart}
                                comparisonEnd={dateRange.comparisonEnd}
                            />
                        </div>

                        {/* Recent Calls List */}
                        <div className="lg:col-span-1">
                            <Card className="border-white/5 shadow-2xl rounded-3xl overflow-hidden bg-surface-dark flex flex-col h-full h-[600px]">
                                <CardHeader className="border-b border-white/5 p-6 bg-white/[0.02]">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-bold font-header tracking-tight">Llamadas Recientes</CardTitle>
                                        <span className="text-[10px] font-mono text-white/40 px-2 py-1 bg-white/5 rounded-full">LIVE</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                                    <CallsList clientId={client.id} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function SidebarItem({ label, active }: { label: string, active?: boolean }) {
    return (
        <button className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
            active ? "bg-accent-blue text-white shadow-lg shadow-accent-blue/20" : "text-white/50 hover:bg-white/5 hover:text-white"
        )}>
            {label}
        </button>
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
