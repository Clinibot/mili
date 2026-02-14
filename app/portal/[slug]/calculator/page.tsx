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

    // Transfer Inputs
    const [percentTransferred, setPercentTransferred] = useState(15); // % Total calls transferred
    const [percentMobileVsLandline, setPercentMobileVsLandline] = useState(90); // % of transfers going to mobile
    const [avgHumanDuration, setAvgHumanDuration] = useState(3.0); // Minutes

    // Constants
    const AGENT_FEE = 480;
    const MAINTENANCE_COST = 55;
    const NUMBER_COST = 1.95;
    const AI_MINUTE_RATE = 0.16;
    const DIVERT_LANDLINE_RATE = 0.010;
    const DIVERT_MOBILE_RATE = 0.029;
    const IVA_RATE = 0.21;

    // Calculations
    const calculations = useMemo(() => {
        // 1. Derive Volumes
        const totalCallsMonth = callsPerDay * workingDays;

        // AI Minutes
        const totalAiMinutes = totalCallsMonth * avgDuration;

        // Transfers
        // 1. Calculate total transferred calls
        const totalTransferredCalls = totalCallsMonth * (percentTransferred / 100);

        // 2. Split into Mobile vs Landline
        const transfersMobile = totalTransferredCalls * (percentMobileVsLandline / 100);
        const transfersLandline = totalTransferredCalls * ((100 - percentMobileVsLandline) / 100);

        const humanMinutesMobile = transfersMobile * avgHumanDuration;
        const humanMinutesLandline = transfersLandline * avgHumanDuration;
        const totalHumanMinutes = humanMinutesMobile + humanMinutesLandline;

        // 2. Mili Costs
        const aiConsumption = totalAiMinutes * AI_MINUTE_RATE;
        const miliSubtotal = MAINTENANCE_COST + aiConsumption;
        const miliIva = miliSubtotal * IVA_RATE;
        const miliTotal = miliSubtotal + miliIva;

        const onboardingCost = numAgents * AGENT_FEE;

        // 3. Netelip Costs
        const numbersCost = numVirtualNumbers * NUMBER_COST;
        const landlineConsumption = humanMinutesLandline * DIVERT_LANDLINE_RATE;
        const mobileConsumption = humanMinutesMobile * DIVERT_MOBILE_RATE;
        const netelipSubtotal = numbersCost + landlineConsumption + mobileConsumption;
        const netelipIva = netelipSubtotal * IVA_RATE;
        const netelipTotal = netelipSubtotal + netelipIva;

        // Grand Total (only recurring)
        const grandTotal = miliTotal + netelipTotal;

        return {
            totalAiMinutes,
            totalHumanMinutes,
            aiConsumption,
            numbersCost,
            landlineConsumption,
            mobileConsumption,
            miliSubtotal,
            miliIva,
            miliTotal,
            netelipSubtotal,
            netelipIva,
            netelipTotal,
            grandTotal,
            onboardingCost
        };
    }, [numAgents, callsPerDay, avgDuration, workingDays, numVirtualNumbers, percentTransferred, percentMobileVsLandline, avgHumanDuration]);

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
                        Calculadora de Costes
                    </h1>
                    <p className="text-[rgba(255,255,255,0.7)] mt-2 text-lg font-sans">
                        Estimación basada en volumen de llamadas.
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
                                    Núm. Virtuales (Netelip)
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

                    {/* Group 2: Transfers */}
                    <div className="card bg-[#0E1219] border border-[#1F2937] rounded-xl p-6 shadow-sm">
                        <h2 className="font-header font-bold text-xl text-[#E8ECF1] mb-6">Transferencias a Humano</h2>
                        <div className="space-y-6">
                            {/* Input 1: % Llamadas Transferidas */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-[rgba(255,255,255,0.55)] text-xs font-mono uppercase tracking-wider">
                                        % Llamadas Transferidas
                                    </label>
                                    <span className="text-[#008DCB] font-mono font-bold text-sm">{percentTransferred}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={percentTransferred}
                                    onChange={(e) => setPercentTransferred(Number(e.target.value))}
                                    className="w-full accent-[#008DCB] cursor-pointer"
                                />
                            </div>

                            {/* Input 2: % Móvil vs Fijo */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-[rgba(255,255,255,0.55)] text-xs font-mono uppercase tracking-wider">
                                        % Transferencia a Móvil (vs Fijo)
                                    </label>
                                    <span className="text-[#008DCB] font-mono font-bold text-sm">{percentMobileVsLandline}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={percentMobileVsLandline}
                                    onChange={(e) => setPercentMobileVsLandline(Number(e.target.value))}
                                    className="w-full accent-[#008DCB] cursor-pointer"
                                />
                                <div className="text-right text-[10px] text-[rgba(255,255,255,0.3)] mt-1 font-mono">
                                    El {100 - percentMobileVsLandline}% restante se transferirá a Fijo.
                                </div>
                            </div>

                            <div>
                                <label className="block text-[rgba(255,255,255,0.55)] text-xs font-mono uppercase tracking-wider mb-2">
                                    Duración Media Humano (Min)
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={avgHumanDuration}
                                    onChange={(e) => setAvgHumanDuration(Number(e.target.value))}
                                    className="w-full bg-[#141A23] border border-[#1F2937] rounded-lg px-4 py-3 text-[#E8ECF1] font-sans focus:outline-none focus:border-[#008DCB] transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="note bg-[rgba(247,142,94,0.06)] border-l-4 border-[#F78E5E] p-6 rounded-r-xl">
                        <h3 className="font-mono font-bold text-sm text-[#F78E5E] mb-2">NOTA IMPORTANTE</h3>
                        <p className="text-[#E8ECF1] text-sm">
                            <strong>Mili Pérez & Son-ia</strong> factura el mantenimiento y los minutos de IA.
                            <br />
                            <strong>Netelip</strong> cobra directamente la numeración y los desvíos.
                        </p>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="lg:col-span-7 space-y-6">

                    {/* 1. Factura Netelip (Moved first per request) */}
                    <div className="card bg-[#0E1219] border border-[#1F2937] rounded-xl overflow-hidden opacity-90">
                        <div className="p-6 border-b border-[#1F2937] bg-[#141A23]">
                            <h2 className="font-header font-bold text-xl text-[#F78E5E]">1. Costes Directos (Netelip)</h2>
                            <p className="text-[rgba(255,255,255,0.55)] text-sm mt-1">Numeración y Telecomunicaciones</p>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-left text-sm">
                                <tbody>
                                    <tr className="border-b border-[#1F2937]">
                                        <td className="py-4 px-6 text-[rgba(255,255,255,0.7)] font-sans">Números Virtuales ({numVirtualNumbers})</td>
                                        <td className="py-4 px-6 text-right font-mono text-[#E8ECF1]">{formatCurrency(calculations.numbersCost)} <span className="text-[10px] text-[rgba(255,255,255,0.4)]">+ IVA</span></td>
                                    </tr>
                                    <tr className="border-b border-[#1F2937]">
                                        <td className="py-4 px-6 text-[rgba(255,255,255,0.7)] font-sans flex items-center gap-2">
                                            Desvío a Humano
                                            <div className="text-xs text-[rgba(255,255,255,0.4)] ml-auto mr-2">
                                                ~{Math.round(calculations.totalHumanMinutes).toLocaleString()} min/mes
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono text-[#E8ECF1]">{formatCurrency(calculations.landlineConsumption + calculations.mobileConsumption)} <span className="text-[10px] text-[rgba(255,255,255,0.4)]">+ IVA</span></td>
                                    </tr>
                                    <tr className="bg-[rgba(247,142,94,0.06)]">
                                        <td className="py-4 px-6 font-header font-bold text-[#E8ECF1]">Total Netelip (con IVA)</td>
                                        <td className="py-4 px-6 text-right font-header font-bold text-xl text-[#F78E5E]">
                                            {formatCurrency(calculations.netelipTotal)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 2. Pago Único (Onboarding) */}
                    <div className="card bg-[#0E1219] border border-[#1F2937] rounded-xl overflow-hidden opacity-90 mb-6">
                        <div className="p-6 border-b border-[#1F2937] bg-[#141A23]">
                            <h2 className="font-header font-bold text-xl text-[#E8ECF1]">2. Pago Único (Onboarding)</h2>
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

                    {/* 3. Costes IA (Mili) */}
                    <div className="card bg-[#0E1219] border border-[#1F2937] rounded-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Calculator size={120} />
                        </div>
                        <div className="p-6 border-b border-[#1F2937] bg-[#141A23]">
                            <h2 className="font-header font-bold text-xl text-[#008DCB]">3. Costes IA (Mili Pérez & Son-ia)</h2>
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
                                            <div className="font-header font-bold text-[#E8ECF1]">Total Recarga Monedero</div>
                                            <div className="text-[10px] text-[#008DCB] font-mono mt-0.5">COSTES IA + MANTENIMIENTO</div>
                                        </td>
                                        <td className="py-4 px-6 text-right font-header font-bold text-xl text-[#008DCB]">
                                            {formatCurrency(calculations.miliTotal)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Grand Total */}
                    <div className="p-6 rounded-xl bg-[#141A23] border border-[#1F2937] flex justify-between items-center mt-6">
                        <div>
                            <h3 className="font-header font-black text-xl text-[#E8ECF1] uppercase tracking-wider">Total Mensual Estimado</h3>
                            <p className="text-xs text-[rgba(255,255,255,0.5)]">Suma de ambas facturas (Sin incluir Pago Único)</p>
                        </div>
                        <span className="font-header font-black text-3xl text-white">{formatCurrency(calculations.grandTotal)}</span>
                    </div>

                </div>
            </div>
        </div>
    );
}
