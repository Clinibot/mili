"use client";

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CallsList from '@/components/CallsList';

export default function LatestCallsPage() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <DashboardLayout>
            <div className="max-w-7xl w-full mx-auto p-6 lg:p-12 space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <p className="text-[#008DCB] font-sans text-xs uppercase tracking-[0.2em] mb-2 font-bold">Resumen Global</p>
                        <h2 className="font-header text-4xl font-black tracking-tight text-[#E8ECF1]">Últimas Llamadas</h2>
                        <p className="text-[rgba(255,255,255,0.4)] text-sm font-medium mt-1">Monitorización en tiempo real de todos los clientes.</p>
                    </div>
                </div>

                {/* Main List */}
                <Card className="border-[#1F2937] shadow-2xl shadow-black/40 rounded-[2rem] overflow-hidden bg-[#0E1219]/80 backdrop-blur-xl">
                    <CardHeader className="p-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2937]/50 bg-gradient-to-r from-transparent to-[#008DCB]/5">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <CardTitle className="text-xl font-black text-[#E8ECF1] tracking-tight">Historial General</CardTitle>
                                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[rgba(103,183,175,0.1)] text-[#67B7AF] rounded-full border border-[rgba(103,183,175,0.2)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#67B7AF] animate-pulse"></span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">LIVE</span>
                                </div>
                            </div>
                            <p className="text-[rgba(255,255,255,0.4)] text-[12px] font-bold uppercase tracking-tighter">Últimas 50 interacciones registradas</p>
                        </div>
                        <div className="flex items-center gap-4 flex-1 max-w-md">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Buscar por número (+34...)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#141A23] border border-[#1F2937] text-[#E8ECF1] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#008DCB]/50 transition-all placeholder:text-[rgba(255,255,255,0.2)]"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)] hover:text-[#E8ECF1]"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
                            <CallsList limit={50} showClientName={true} searchQuery={searchQuery} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
