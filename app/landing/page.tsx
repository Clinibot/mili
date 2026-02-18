"use client";

import { Bot, ShieldCheck, Activity, BarChart3, Bell, Command, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#070A0F] text-[#E8ECF1] font-sans selection:bg-[#008DCB] selection:text-white overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-[#070A0F]/80 backdrop-blur-xl border-b border-[#1F2937]/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#008DCB]/10 rounded-xl flex items-center justify-center border border-[#008DCB]/20">
                            <Bot className="text-[#008DCB]" size={24} />
                        </div>
                        <span className="text-xl font-black tracking-tighter">
                            Mili Pérez <span className="text-[#008DCB]">&</span> Son-ia
                        </span>
                    </div>
                    <Link href="/login">
                        <button className="bg-[#141A23] border border-[#1F2937] hover:border-[#008DCB]/50 text-sm font-bold px-6 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-2 group">
                            Acceso Clientes
                            <ArrowRight size={16} className="text-[#008DCB] group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center space-y-8 mb-32 relative">
                        {/* Gradient Orbs */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#008DCB]/10 rounded-full blur-[120px] -z-10" />

                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#141A23] border border-[#1F2937] rounded-full">
                            <ShieldCheck size={14} className="text-[#008DCB]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgba(232,236,241,0.6)]">Panel de Control Autorizado</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] max-w-4xl mx-auto">
                            Gestiona tus <span className="text-[#008DCB]">Agentes de Voz</span> con Inteligencia Real.
                        </h1>

                        <p className="text-lg md:text-xl text-[rgba(232,236,241,0.5)] max-w-2xl mx-auto leading-relaxed font-medium">
                            Centro de mando exclusivo para clientes de Mili Pérez y Sonia Ortiz. Visualiza llamadas en tiempo real, analiza KPI's y gestiona tu saldo desde una interfaz diseñada para la excelencia.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                            <Link href="/login">
                                <button className="w-full sm:w-auto bg-[#008DCB] text-[#070A0F] font-black px-10 py-5 rounded-[2rem] text-lg shadow-2xl shadow-[#008DCB]/30 hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-3">
                                    Explorar Dashboard
                                    <ChevronRight size={20} />
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
                        <div className="bg-[#0E1219] border border-[#1F2937] p-10 rounded-[2.5rem] space-y-6 hover:border-[#008DCB]/30 transition-all group">
                            <div className="w-14 h-14 bg-[#141A23] border border-[#1F2937] rounded-2xl flex items-center justify-center text-[#008DCB] group-hover:bg-[#008DCB] group-hover:text-[#070A0F] transition-all">
                                <BarChart3 size={28} />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">Analítica Avanzada</h3>
                            <p className="text-[rgba(232,236,241,0.4)] leading-relaxed font-medium">
                                Visualiza la eficiencia de tu IA con gráficos detallados, costes por llamada y tasas de éxito en tiempo real.
                            </p>
                        </div>

                        <div className="bg-[#0E1219] border border-[#1F2937] p-10 rounded-[2.5rem] space-y-6 hover:border-[#008DCB]/30 transition-all group">
                            <div className="w-14 h-14 bg-[#141A23] border border-[#1F2937] rounded-2xl flex items-center justify-center text-[#008DCB] group-hover:bg-[#008DCB] group-hover:text-[#070A0F] transition-all">
                                <Activity size={28} />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">Control en Vivo</h3>
                            <p className="text-[rgba(232,236,241,0.4)] leading-relaxed font-medium">
                                Monitoriza cada interacción. Accede a transcripciones completas y grabaciones de audio de forma segura.
                            </p>
                        </div>

                        <div className="bg-[#0E1219] border border-[#1F2937] p-10 rounded-[2.5rem] space-y-6 hover:border-[#008DCB]/30 transition-all group">
                            <div className="w-14 h-14 bg-[#141A23] border border-[#1F2937] rounded-2xl flex items-center justify-center text-[#008DCB] group-hover:bg-[#008DCB] group-hover:text-[#070A0F] transition-all">
                                <Bell size={28} />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">Alertas Inteligentes</h3>
                            <p className="text-[rgba(232,236,241,0.4)] leading-relaxed font-medium">
                                Configura resúmenes diarios, semanales o notificaciones de saldo bajo directamente en tu email.
                            </p>
                        </div>
                    </div>

                    {/* Exclusivity Section */}
                    <div className="bg-[#0E1219] border border-[#1F2937] rounded-[3rem] p-8 md:p-16 relative overflow-hidden text-center space-y-8">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#008DCB] to-transparent opacity-50" />
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight">Para los clientes que buscan <span className="text-[#008DCB]">la cima</span>.</h2>
                        <p className="text-[rgba(232,236,241,0.5)] max-w-2xl mx-auto font-medium">
                            Este portal está diseñado específicamente para servir a los clientes exclusivos de Mili Pérez y Sonia Ortiz. No es una plataforma abierta; es tu centro de operaciones privado.
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#1F2937]/50 py-20 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="space-y-4 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <Bot className="text-[#008DCB]" size={20} />
                            <span className="text-lg font-black tracking-tighter">Mili y son-ia</span>
                        </div>
                        <p className="text-xs text-[rgba(232,236,241,0.3)] font-medium max-w-[200px]">
                            Optimización y gestión de agentes de voz con IA avanzada.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-8 items-center">
                        <Link href="/politica-privacidad" className="text-xs font-bold text-[rgba(232,236,241,0.4)] hover:text-[#008DCB] transition-colors uppercase tracking-widest">Privacidad</Link>
                        <Link href="/condiciones-servicio" className="text-xs font-bold text-[rgba(232,236,241,0.4)] hover:text-[#008DCB] transition-colors uppercase tracking-widest">Términos</Link>
                    </div>

                    <div className="text-center md:text-right">
                        <p className="text-[10px] text-[rgba(232,236,241,0.3)] font-bold uppercase tracking-[0.2em]">
                            &copy; {new Date().getFullYear()} centrodemando.es
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
