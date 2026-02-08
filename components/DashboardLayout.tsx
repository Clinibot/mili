"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Users, FileText, Settings,
    Menu, X, Bell, Search, ChevronDown, LogOut,
    BookOpen, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
        { name: 'Facturas', icon: FileText, href: '/invoices' },
        { name: 'Documentación', icon: BookOpen, href: '/docs' },
        { name: 'Qué está pasando?', icon: Activity, href: '/activity' },
    ];

    const getWelcomeMessage = () => {
        if (!userEmail) return 'Bienvenido';
        if (userEmail.toLowerCase().includes('sonia')) return 'Hola Sonia!';
        if (userEmail.toLowerCase().includes('mili')) return 'Hola Mili!';
        return 'Hola Admin!';
    };

    const getUserInitials = () => {
        if (!userEmail) return 'AD';
        if (userEmail.toLowerCase().includes('sonia')) return 'SO';
        if (userEmail.toLowerCase().includes('mili')) return 'MI';
        return 'AD';
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            // Force clear local storage just in case
            localStorage.removeItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1].split('.')[0] + '-auth-token');
        } catch (error) {
            console.error('Error logging out:', error);
        } finally {
            window.location.href = '/login';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-40 h-screen transition-transform bg-white border-r border-slate-200 shadow-sm",
                    isSidebarOpen ? "w-64 translate-x-0" : "w-20 -translate-x-full lg:translate-x-0 lg:w-20"
                )}
            >
                <div className="h-full px-3 py-4 overflow-y-auto pb-24">
                    <div className="flex items-center gap-2 mb-10 px-4 h-10">
                        <div className="flex items-center gap-2">
                            <span className={cn("text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 transition-opacity whitespace-nowrap",
                                isSidebarOpen ? "opacity-100" : "opacity-0 invisible")}>
                                IA para llamadas
                            </span>
                        </div>
                    </div>

                    <ul className="space-y-2 font-medium">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center p-3 rounded-xl transition-all group",
                                            isActive
                                                ? "bg-blue-50 text-blue-600 shadow-sm"
                                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        <item.icon size={22} className={cn("transition-colors", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                                        <span className={cn("ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 font-semibold",
                                            isSidebarOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0"
                                        )}>
                                            {item.name}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Bottom Logout */}
                <div className="absolute bottom-0 left-0 w-full p-4 bg-white border-t border-slate-100/50 z-50">
                    <button
                        onClick={handleLogout}
                        className={cn("flex items-center gap-3 p-3 text-slate-400 hover:text-red-500 transition-all w-full hover:bg-red-50 rounded-xl",
                            !isSidebarOpen && "justify-center")}
                    >
                        <LogOut size={20} />
                        <span className={cn("text-sm font-semibold transition-all overflow-hidden",
                            isSidebarOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0")}>
                            Cerrar Sesión
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={cn("p-4 transition-all duration-300 min-h-screen", isSidebarOpen ? "lg:ml-64" : "lg:ml-20")}>
                <div className="p-4 rounded-3xl min-h-[calc(100vh-2rem)]">
                    {/* Top Navbar */}
                    <header className="flex justify-between items-center mb-8 bg-white/60 backdrop-blur-md p-4 rounded-2xl sticky top-4 z-30 shadow-sm border border-slate-100">
                        <h2 className="text-2xl font-bold text-slate-800 ml-4">
                            {getWelcomeMessage()}
                        </h2>

                        <div className="flex items-center gap-4">
                            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
                                <Bell size={20} />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                            </button>
                            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-blue-500/20">
                                    {getUserInitials()}
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-sm font-semibold text-slate-700 leading-none">
                                        {userEmail?.toLowerCase().includes('sonia') ? 'Sonia Ortiz' :
                                            userEmail?.toLowerCase().includes('mili') ? 'Mili' : 'Administrador'}
                                    </p>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Admin</p>
                                </div>
                                <ChevronDown size={16} className="text-slate-400 cursor-pointer" />
                            </div>
                        </div>
                    </header>

                    {children}
                </div>
            </div>
        </div>
    );
}
