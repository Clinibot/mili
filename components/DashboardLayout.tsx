"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Settings, Menu, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    collapsed: boolean;
}

const NavItem = ({ href, icon, label, isActive, collapsed }: NavItemProps) => (
    <Link
        href={href}
        className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
            isActive
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                : "text-slate-400 hover:text-white hover:bg-white/5",
            collapsed ? "justify-center" : ""
        )}
    >
        {icon}
        {!collapsed && <span className="font-medium">{label}</span>}
        {collapsed && (
            <div className="absolute left-[60px] bg-slate-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                {label}
            </div>
        )}
    </Link>
);

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-[#0F1115] text-white font-sans flex overflow-hidden selection:bg-blue-500/30">

            {/* Sidebar - Glassmorphism */}
            <aside
                className={cn(
                    "relative z-20 flex flex-col border-r border-white/5 bg-[#0F1115] transition-all duration-300 ease-in-out",
                    collapsed ? "w-20" : "w-64"
                )}
            >
                <div className="p-6 flex items-center justify-between">
                    {!collapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
                                M
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                Mili
                            </span>
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors ml-auto"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-3 py-6 space-y-2">
                    <NavItem
                        href="/"
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                        isActive={pathname === '/'}
                        collapsed={collapsed}
                    />
                    <NavItem
                        href="/clients"
                        icon={<Users size={20} />}
                        label="Clientes"
                        isActive={pathname.startsWith('/clients')}
                        collapsed={collapsed}
                    />
                    <NavItem
                        href="/invoices"
                        icon={<FileText size={20} />}
                        label="Facturas"
                        isActive={pathname.startsWith('/invoices')}
                        collapsed={collapsed}
                    />
                </nav>

                <div className="p-3 mt-auto">
                    <NavItem
                        href="/settings"
                        icon={<Settings size={20} />}
                        label="Configuración"
                        isActive={pathname === '/settings'}
                        collapsed={collapsed}
                    />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Top Navbar */}
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0F1115]/50 backdrop-blur-md sticky top-0 z-10">
                    <h1 className="text-lg font-semibold text-slate-200">
                        {pathname === '/' ? 'Vista General' : pathname.split('/').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ')}
                    </h1>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
                        </button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold border-2 border-[#0F1115]">
                            SO
                        </div>
                    </div>
                </header>

                {/* Content Scroll View */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {children}
                </div>

                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-[500px] bg-blue-500/5 blur-[120px] pointer-events-none rounded-full -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full translate-y-1/2"></div>
            </main>
        </div>
    );
}
