"use client";

import { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import NotificationBell from './NotificationBell';
import { Wallet, LayoutDashboard, Phone, Mic, CreditCard, BarChart3, Settings, Menu, X, Calculator } from 'lucide-react';
import { PortalProvider } from './PortalContext';

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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!slug) return;
        async function fetchClient() {
            try {
                const isUuid = slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

                if (isUuid) {
                    // Buscar por ID (UUID)
                    const { data, error } = await supabase
                        .from('clients')
                        .select('*')
                        .eq('id', slug)
                        .single();
                    if (data && !error) setClient(data);
                } else {
                    // Buscar por slug
                    const { data, error } = await supabase
                        .from('clients')
                        .select('*')
                        .eq('slug', slug)
                        .single();
                    if (data && !error) setClient(data);
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
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 font-medium">Cargando aplicación...</div>;
    }

    if (!client) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 font-medium">Cliente no encontrado.</div>;
    }

    const navigation = [
        { name: 'Dashboard', href: `/portal/${slug}`, icon: LayoutDashboard },
        { name: 'Llamadas', href: `/portal/${slug}#llamadas`, icon: Phone },
        { name: 'Calculadora', href: `/portal/${slug}/calculator`, icon: Calculator },
        { name: 'Monedero', href: `/portal/${slug}/billing`, icon: CreditCard },
    ];

    return (
        <div className="min-h-screen bg-[#070A0F] text-[#E8ECF1] font-sans selection:bg-[#008DCB] selection:text-white flex">
            <Toaster />

            {/* Mobile Menu Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300 backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "w-64 bg-[#0E1219] border-r border-[#1F2937] flex-col h-screen z-40",
                "fixed inset-y-0 left-0 lg:sticky lg:top-0",
                "transition-transform duration-300 ease-in-out",
                isMobileMenuOpen ? "flex translate-x-0" : "hidden lg:flex lg:translate-x-0"
            )}>
                <div className="p-8 border-b border-[#1F2937] flex items-center justify-between">
                    <h1 className="text-xl font-header font-black tracking-tighter text-[#E8ECF1]">
                        Mili Pérez <span className="text-[#008DCB]">&</span> Son-ia
                    </h1>
                    {/* Close button for mobile */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden p-2 rounded-lg hover:bg-[#141A23] transition-colors"
                        aria-label="Cerrar menú"
                    >
                        <X size={20} className="text-[#9CA3AF]" />
                    </button>
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
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group",
                                    isActive
                                        ? "bg-[rgba(0,141,203,0.15)] text-[#008DCB] border border-[rgba(0,141,203,0.2)]"
                                        : "text-[#9CA3AF] hover:bg-[#141A23] hover:text-[#E8ECF1]"
                                )}
                            >
                                <item.icon size={18} className={cn(isActive ? "text-[#008DCB]" : "text-[#4B5563] group-hover:text-[#9CA3AF]")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 lg:h-24 bg-[#070A0F]/80 backdrop-blur-xl border-b border-[#1F2937] flex items-center justify-between px-4 lg:px-12 sticky top-0 z-50">
                    <div className="flex items-center gap-3 lg:gap-4">
                        {/* Hamburger Menu Button (Mobile Only) */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 rounded-lg hover:bg-[#141A23] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="Abrir menú"
                        >
                            <Menu size={24} className="text-[#E8ECF1]" />
                        </button>

                        <h2 className="font-header text-base lg:text-xl font-bold tracking-tight text-[#E8ECF1]">
                            {navigation.find(n => pathname === n.href)?.name || 'Portal'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-6">
                        {/* Wallet Summary Link */}
                        <Link
                            href={`/portal/${slug}/billing`}
                            className="bg-[#0E1219] hover:bg-[#141A23] rounded-2xl px-3 lg:px-5 py-2 lg:py-2.5 border border-[#1F2937] transition-all flex items-center gap-2 lg:gap-3 active:scale-95 group"
                        >
                            <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-xl bg-[rgba(0,141,203,0.15)] flex items-center justify-center text-[#008DCB] group-hover:bg-[#008DCB] group-hover:text-white transition-all">
                                <Wallet size={14} className="lg:w-4 lg:h-4" />
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] lg:text-[10px] font-bold text-[#4B5563] uppercase tracking-wider leading-none mb-0.5 lg:mb-1">Saldo</p>
                                <p className="text-xs lg:text-sm font-black text-[#E8ECF1] leading-none">{(client.balance || 0).toFixed(2)}€</p>
                            </div>
                        </Link>

                        <div className="flex items-center gap-2 lg:gap-4 pl-3 lg:pl-6 border-l border-[#1F2937]">
                            <NotificationBell clientId={client.id} />
                            <div className="text-right hidden md:block">
                                <p className="text-xs lg:text-sm font-bold text-[#E8ECF1] leading-tight">{client.name}</p>
                                <p className="text-[9px] lg:text-[10px] text-[#4B5563] font-bold uppercase tracking-wider">{client.contact_name}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main>
                    <PortalProvider value={{ client, slug: slug as string }}>
                        {children}
                    </PortalProvider>
                </main>
            </div>
        </div>
    );
}
