"use client";

import { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import NotificationBell from './NotificationBell';
import { Wallet, LayoutDashboard, Phone, Mic, CreditCard, BarChart3, Settings } from 'lucide-react';

interface Client {
    id: string;
    name: string;
    phone_ia: string;
    contact_name: string;
    balance?: number;
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const slug = params?.slug as string;
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        async function fetchClient() {
            try {
                const isUuid = slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
                let query = supabase.from('clients').select('*');
                if (isUuid) {
                    query = query.eq('id', slug);
                } else {
                    query = query.or(`slug.eq.${slug},id.eq.${slug},name.ilike.%${slug}%`);
                }
                const { data } = await query.single();
                if (data) setClient(data);
            } catch (err) {
                console.error("Error fetching client", err);
            } finally {
                setLoading(false);
            }
        }
        fetchClient();
    }, [slug]);

    if (loading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 font-medium">Cargando aplicación...</div>;
    }

    if (!client) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 font-medium">Cliente no encontrado.</div>;
    }

    const navigation = [
        { name: 'Dashboard', href: `/portal/${slug}`, icon: LayoutDashboard },
        { name: 'Llamadas', href: `/portal/${slug}#llamadas`, icon: Phone },
        { name: 'Monedero', href: `/portal/${slug}/billing`, icon: CreditCard },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 flex">
            <Toaster />

            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen hidden lg:flex">
                <div className="p-8 border-b border-slate-100">
                    <h1 className="font-header text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        IA para llamadas
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-4">
                    {navigation.map((item) => {
                        const isDashboardRoot = item.name === 'Dashboard';
                        const isActive = isDashboardRoot
                            ? pathname === item.href
                            : pathname.startsWith(item.href) && item.href !== `/portal/${slug}`;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <item.icon size={18} className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-blue-500")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <h2 className="font-header text-xl font-bold tracking-tight text-slate-800">
                            {navigation.find(n => pathname === n.href)?.name || 'Portal'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Wallet Summary Link */}
                        <Link
                            href={`/portal/${slug}/billing`}
                            className="bg-slate-50 hover:bg-slate-100 rounded-2xl px-5 py-2.5 border border-slate-100 transition-all flex items-center gap-3 active:scale-95 group"
                        >
                            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <Wallet size={16} />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Mi Saldo</p>
                                <p className="text-sm font-black text-slate-900 leading-none">{(client.balance || 0).toFixed(2)}€</p>
                            </div>
                        </Link>

                        <div className="flex items-center gap-4 pl-6 border-l border-slate-100">
                            <NotificationBell clientId={client.id} />
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900 leading-tight">{client.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{client.contact_name}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main>
                    {children}
                </main>
            </div>
        </div>
    );
}
