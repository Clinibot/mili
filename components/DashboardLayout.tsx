"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Users, FileText, Settings,
    Menu, X, Bell, Search, ChevronDown, LogOut,
    BookOpen, Activity, Calculator
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || null);
            }
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserEmail(session?.user?.email || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const menuItems = [
        { name: 'Clientes', icon: Users, href: '/' },
        { name: 'Últimas Llamadas', icon: Activity, href: '/latest-calls' },
        { name: 'Facturas', icon: FileText, href: '/invoices' },
        { name: 'Documentación', icon: BookOpen, href: '/docs' },
        { name: 'Calculadora', icon: Calculator, href: '/calculator' },
    ];

    const getGreeting = () => {
        if (!userEmail) return 'Bienvenida';
        if (userEmail.toLowerCase().includes('sonia')) return 'Hola, Sonia';
        if (userEmail.toLowerCase().includes('mili')) return 'Hola, Mili';
        return 'Bienvenida';
    };

    const getUserInitials = () => {
        if (!userEmail) return 'AD';
        if (userEmail.toLowerCase().includes('sonia')) return 'SO';
        if (userEmail.toLowerCase().includes('mili')) return 'MI';
        return 'AD';
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error logging out:', error);
        } finally {
            window.location.href = '/login';
        }
    };

    return (
        <div className="min-h-screen bg-[#070A0F] text-[#E8ECF1] font-sans selection:bg-[#008DCB] selection:text-white">
            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-30 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-40 h-screen w-64 bg-[#0E1219] border-r border-[#1F2937] shadow-xl shadow-black/20 flex-col transition-transform duration-300",
                    isMobileMenuOpen ? "flex translate-x-0" : "hidden lg:flex translate-x-0"
                )}
            >
                <div className="h-full px-3 py-4 overflow-y-auto pb-24 custom-scrollbar">
                    <div className="flex items-center justify-between mb-10 px-4 h-10">
                        <span className="text-xl font-header font-black tracking-tighter text-[#E8ECF1] whitespace-nowrap">
                            Mili Pérez <span className="text-[#008DCB]">&</span> Son-ia
                        </span>
                        {/* Close button for mobile */}
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="lg:hidden p-2 rounded-xl hover:bg-[#141A23] text-[rgba(255,255,255,0.55)] hover:text-[#E8ECF1] transition-colors"
                            aria-label="Cerrar menú"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <ul className="space-y-2 font-medium">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center p-3 rounded-xl transition-all group border border-transparent",
                                            isActive
                                                ? "bg-[#008DCB] text-[#070A0F] shadow-lg shadow-[#008DCB]/20 font-bold"
                                                : "text-[rgba(255,255,255,0.55)] hover:bg-[#141A23] hover:text-[#E8ECF1] hover:border-[#1F2937]"
                                        )}
                                    >
                                        <item.icon size={20} className={cn("transition-colors", isActive ? "text-[#070A0F]" : "text-[rgba(255,255,255,0.3)] group-hover:text-[#E8ECF1]")} />
                                        <span className="ml-3 whitespace-nowrap text-sm tracking-wide">
                                            {item.name}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Bottom Logout */}
                <div className="absolute bottom-0 left-0 w-full p-4 bg-[#0E1219] border-t border-[#1F2937] z-50">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 p-3 text-[rgba(255,255,255,0.3)] hover:text-[#F78E5E] transition-all w-full hover:bg-[#F78E5E]/10 rounded-xl group"
                    >
                        <LogOut size={20} className="group-hover:stroke-[#F78E5E] transition-colors" />
                        <span className="text-sm font-bold tracking-wide">
                            Cerrar Sesión
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:ml-64 p-4 transition-all duration-300 min-h-screen">
                <div className="p-4 rounded-[2rem] min-h-[calc(100vh-2rem)] border border-[#1F2937]/50 bg-[#0E1219]/30 relative overflow-hidden">
                    {/* Top Navbar */}
                    <header className="flex justify-between items-center mb-8 bg-[#0E1219]/80 backdrop-blur-xl p-3 lg:p-4 rounded-2xl sticky top-4 z-30 shadow-2xl shadow-black/20 border border-[#1F2937]">
                        <div className="flex items-center gap-3">
                            {/* Hamburger Menu Button (Mobile Only) */}
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="lg:hidden p-2 rounded-xl hover:bg-[#141A23] text-[#E8ECF1] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center border border-transparent hover:border-[#1F2937]"
                                aria-label="Abrir menú"
                            >
                                <Menu size={24} />
                            </button>
                            <div>
                                <h2 className="text-lg lg:text-2xl font-black font-header tracking-tight text-[#E8ECF1] ml-1 lg:ml-2">
                                    {getGreeting()}
                                </h2>
                                <p className="text-[10px] font-mono font-bold text-[#008DCB] uppercase tracking-widest ml-1 lg:ml-2 hidden sm:block">
                                    Panel de Administración
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 lg:gap-4">
                            <button className="p-2.5 rounded-xl text-[rgba(255,255,255,0.3)] hover:text-[#E8ECF1] hover:bg-[#141A23] transition-all relative border border-transparent hover:border-[#1F2937]">
                                <Bell size={20} />
                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#F78E5E] rounded-full ring-2 ring-[#0E1219]"></span>
                            </button>
                            <div className="flex items-center gap-3 pl-4 border-l border-[#1F2937]">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#008DCB] to-[#67B7AF] flex items-center justify-center text-[#070A0F] text-sm font-black shadow-lg shadow-[#008DCB]/20 ring-2 ring-[#1F2937]">
                                    {getUserInitials()}
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-sm font-bold text-[#E8ECF1] leading-none">
                                        {userEmail?.toLowerCase().includes('sonia') ? 'Sonia Ortiz' :
                                            userEmail?.toLowerCase().includes('mili') ? 'Mili' : 'Administrador'}
                                    </p>
                                    <p className="text-[10px] text-[rgba(255,255,255,0.4)] uppercase tracking-wider font-bold mt-1">Admin</p>
                                </div>
                                <ChevronDown size={14} className="text-[rgba(255,255,255,0.3)] cursor-pointer hidden md:block hover:text-[#E8ECF1] transition-colors" />
                            </div>
                        </div>
                    </header>

                    {children}
                </div>
            </div>
        </div>
    );
}
