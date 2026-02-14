"use client";

import { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';

export default function ClientPortalCalculator() {
    // Volume Inputs
    const [numAgents, setNumAgents] = useState(1);
    const [callsPerDay, setCallsPerDay] = useState(50);
    const [avgDuration, setAvgDuration] = useState(2.5); // Minutes
    const [workingDays, setWorkingDays] = useState(22); // Month
    const [numVirtualNumbers, setNumVirtualNumbers] = useState(1);

    // Constants
    const AGENT_FEE = 480;
    const MAINTENANCE_COST = 55;
    const NUMBER_COST = 1.95;
    const AI_MINUTE_RATE = 0.21;
    const IVA_RATE = 0.21;

    // Calculations
    const calculations = useMemo(() => {
        const totalCallsMonth = callsPerDay * workingDays;
        const totalAiMinutes = totalCallsMonth * avgDuration;

        const aiConsumption = totalAiMinutes * AI_MINUTE_RATE;
        const numbersCost = numVirtualNumbers * NUMBER_COST;
        const onboardingCost = numAgents * AGENT_FEE;

        const monthlySubtotal = MAINTENANCE_COST + numbersCost + aiConsumption;
        const monthlyIva = monthlySubtotal * IVA_RATE;
        const monthlyTotal = monthlySubtotal + monthlyIva;

        return {
            totalAiMinutes,
            aiConsumption,
            numbersCost,
            onboardingCost,
            monthlySubtotal,
            monthlyIva,
            monthlyTotal
        };
    }, [numAgents, callsPerDay, avgDuration, workingDays, numVirtualNumbers]);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    return (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto relative">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-header font-black tracking-tight text-[#E8ECF1] flex items-center gap-3">
                        <div className="p-2 bg-[rgba(0,141,203,0.15)] rounded-lg text-[#008DCB]">
                            <Calculator size={24} />
                        </div>
                        Calculadora de Costes IA
                    </h1>
                    <p className="text-[rgba(255,255,255,0.7)] mt-2 text-lg font-sans">
                        Estimación de inversión basada en volumen de llamadas.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Inputs Section */}
                <div className="lg:col-span-5 space-y-6">

                    {/* Group 1: Volume */}
                    <div className="card bg-[#0E1219] border border-[#1F2937] rounded-xl p-6 shadow-sm">
                        <h2 className="font-header font-bold text-xl text-[#E8ECF1] mb-6">Volumen y Configuración</h2>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[rgba(255,255,255,0.55)] text-xs font-mono uppercase tracking-wider mb-2">
                                        Nº Agentes IA
                                    </label>
                                    <input
                                        type="number"
                                        value={numAgents}
                                        min="1"
                                        onChange={(e) => setNumAgents(Math.max(1, Number(e.target.value)))}
                                        className="w-full bg-[#141A23] border border-[#1F2937] rounded-lg px-4 py-3 text-[#E8ECF1] font-sans focus:outline-none focus:border-[#008DCB] transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[rgba(255,255,255,0.55)] text-xs font-mono uppercase tracking-wider mb-2">
                                        Llamadas/Día
                                    </label>
                                    <input
                                        type="number"
                                        value={callsPerDay}
                                        onChange={(e) => setCallsPerDay(Number(e.target.value))}
                                        className="w-full bg-[#141A23] border border-[#1F2937] rounded-lg px-4 py-3 text-[#E8ECF1] font-sans focus:outline-none focus:border-[#008DCB] transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[rgba(255,255,255,0.55)] text-xs font-mono uppercase tracking-wider mb-2">
                                        Duración Media (Min)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={avgDuration}
                                        onChange={(e) => setAvgDuration(Number(e.target.value))}
                                        className="w-full bg-[#141A23] border border-[#1F2937] rounded-lg px-4 py-3 text-[#E8ECF1] font-sans focus:outline-none focus:border-[#008DCB] transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[rgba(255,255,255,0.55)] text-xs font-mono uppercase tracking-wider mb-2">
                                        Días Laborables
                                    </label>
                                    <input
                                        type="number"
                                        value={workingDays}
                                        onChange={(e) => setWorkingDays(Number(e.target.value))}
                                        className="w-full bg-[#141A23] border border-[#1F2937] rounded-lg px-4 py-3 text-[#E8ECF1] font-sans focus:outline-none focus:border-[#008DCB] transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[rgba(255,255,255,0.55)] text-xs font-mono uppercase tracking-wider mb-2">
                                    Números Virtuales
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={numVirtualNumbers}
                                    onChange={(e) => setNumVirtualNumbers(Math.max(1, Number(e.target.value)))}
                                    className="w-full bg-[#141A23] border border-[#1F2937] rounded-lg px-4 py-3 text-[#E8ECF1] font-sans focus:outline-none focus:border-[#008DCB] transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="lg:col-span-7 space-y-6">

                    {/* 1. Pago Único (Onboarding) */}
                    <div className="card bg-[#0E1219] border border-[#1F2937] rounded-xl overflow-hidden opacity-90 mb-6">
                        <div className="p-6 border-b border-[#1F2937] bg-[#141A23]">
                            <h2 className="font-header font-bold text-xl text-[#E8ECF1]">1. Pago Único (Onboarding)</h2>
                            <p className="text-[rgba(255,255,255,0.55)] text-sm mt-1">Coste de alta y configuración inicial</p>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-left text-sm">
                                <tbody>
                                    <tr className="bg-[rgba(0,141,203,0.03)] border-b border-[#1F2937]">
                                        <td className="py-4 px-6 text-[rgba(255,255,255,0.7)] font-sans">
                                            Alta por Agente
                                            <div className="text-xs text-[rgba(255,255,255,0.4)] mt-1">
                                                {numAgents} Agente(s) x {formatCurrency(AGENT_FEE)}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono text-[#E8ECF1]">{formatCurrency(calculations.onboardingCost)} <span className="text-[10px] text-[rgba(255,255,255,0.4)]">+ IVA</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 2. Costes IA (Mili) */}
                    <div className="card bg-[#0E1219] border border-[#1F2937] rounded-xl overflow-hidden relative">
                        <div className="p-6 border-b border-[#1F2937] bg-[#141A23]">
                            <h2 className="font-header font-bold text-xl text-[#008DCB]">2. Costes IA (Mili Pérez & Son-ia)</h2>
                            <p className="text-[rgba(255,255,255,0.55)] text-sm mt-1">Servicios de Inteligencia Artificial y Mantenimiento</p>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-left text-sm">
                                <tbody>
                                    <tr className="border-b border-[#1F2937]">
                                        <td className="py-4 px-6 text-[rgba(255,255,255,0.7)] font-sans">Mantenimiento Mensual</td>
                                        <td className="py-4 px-6 text-right font-mono text-[#E8ECF1]">{formatCurrency(MAINTENANCE_COST)} <span className="text-[10px] text-[rgba(255,255,255,0.4)]">+ IVA</span></td>
                                    </tr>
                                    <tr className="border-b border-[#1F2937]">
                                        <td className="py-4 px-6 text-[rgba(255,255,255,0.7)] font-sans">Números Virtuales ({numVirtualNumbers})</td>
                                        <td className="py-4 px-6 text-right font-mono text-[#E8ECF1]">{formatCurrency(calculations.numbersCost)} <span className="text-[10px] text-[rgba(255,255,255,0.4)]">+ IVA</span></td>
                                    </tr>
                                    <tr className="border-b border-[#1F2937]">
                                        <td className="py-4 px-6 text-[rgba(255,255,255,0.7)] font-sans">
                                            Consumo IA
                                            <div className="text-xs text-[rgba(255,255,255,0.4)] mt-1">
                                                ~{Math.round(calculations.totalAiMinutes).toLocaleString()} min/mes
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono text-[#E8ECF1]">{formatCurrency(calculations.aiConsumption)} <span className="text-[10px] text-[rgba(255,255,255,0.4)]">+ IVA</span></td>
                                    </tr>
                                    <tr className="bg-[rgba(0,141,203,0.06)]">
                                        <td className="py-4 px-6">
                                            <div className="font-header font-bold text-[#E8ECF1]">Total Mensual Estimado</div>
                                            <div className="text-[10px] text-[#008DCB] font-mono mt-0.5">IVA INCLUIDO</div>
                                        </td>
                                        <td className="py-4 px-6 text-right font-header font-bold text-xl text-[#008DCB]">
                                            {formatCurrency(calculations.monthlyTotal)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
