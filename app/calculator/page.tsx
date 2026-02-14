"use client";

import { useState, useMemo } from 'react';
import { Calculator, Info, HelpCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';


export default function CalculatorPage() {
    // State for inputs
    const [aiMinutes, setAiMinutes] = useState(2000);
    const [numVirtualNumbers, setNumVirtualNumbers] = useState(1);
    const [divertsLandline, setDivertsLandline] = useState(0);
    const [divertsMobile, setDivertsMobile] = useState(0);

    // Constants
    const ONBOARDING_COST = 480;
    const MAINTENANCE_COST = 55;
    const NUMBER_COST = 1.95;
    const AI_MINUTE_RATE = 0.16;
    const DIVERT_LANDLINE_RATE = 0.010;
    const DIVERT_MOBILE_RATE = 0.029;
    const IVA_RATE = 0.21;

    // Calculations
    const calculations = useMemo(() => {
        // Mili Costs
        const aiConsumption = aiMinutes * AI_MINUTE_RATE;
        const miliSubtotal = MAINTENANCE_COST + aiConsumption;
        const miliIva = miliSubtotal * IVA_RATE;
        const miliTotal = miliSubtotal + miliIva;

        // Netelip Costs (Direct to Provider)
        const numbersCost = numVirtualNumbers * NUMBER_COST;
        const landlineConsumption = divertsLandline * DIVERT_LANDLINE_RATE;
        const mobileConsumption = divertsMobile * DIVERT_MOBILE_RATE;
        const netelipSubtotal = numbersCost + landlineConsumption + mobileConsumption;
        const netelipIva = netelipSubtotal * IVA_RATE;
        const netelipTotal = netelipSubtotal + netelipIva;


        const onboardingIva = ONBOARDING_COST * IVA_RATE;
        const onboardingTotal = ONBOARDING_COST + onboardingIva;

        // Grand Total (Estimated Client Spend)
        const grandTotal = miliTotal + netelipTotal;

        return {
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
            onboardingTotal,
            onboardingIva
        };
    }, [aiMinutes, numVirtualNumbers, divertsLandline, divertsMobile]);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    return (
        <DashboardLayout>
            <div className="p-4 lg:p-8 max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-header font-black tracking-tight text-[#E8ECF1] flex items-center gap-3">
                        <div className="p-2 bg-[rgba(0,141,203,0.15)] rounded-lg text-[#008DCB]">
                            <Calculator size={24} />
                        </div>
                        Calculadora de Costes
                    </h1>
                    <p className="text-[rgba(255,255,255,0.7)] mt-2 text-lg font-sans">
                        Desglose de costes: Facturación Mili (IA) vs. Costes Directos (Telefónica).
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Inputs Section */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="card bg-[#0E1219] border border-[#1F2937] rounded-xl p-6 shadow-sm">
                            <h2 className="font-header font-bold text-xl text-[#E8ECF1] mb-6">Configurar Consumo</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[rgba(255,255,255,0.55)] text-xs font-mono uppercase tracking-wider mb-2">
                                        Minutos IA Mensuales
                                    </label>
                                    <input
                                        type="number"
                                        value={aiMinutes}
                                        onChange={(e) => setAiMinutes(Number(e.target.value))}
                                        className="w-full bg-[#141A23] border border-[#1F2937] rounded-lg px-4 py-3 text-[#E8ECF1] font-sans focus:outline-none focus:border-[#008DCB] transition-colors"
                                    />
                                    <p className="text-[rgba(255,255,255,0.55)] text-xs mt-2">
                                        Estimado: {formatCurrency(calculations.aiConsumption)} ({AI_MINUTE_RATE}€/min)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[rgba(255,255,255,0.55)] text-xs font-mono uppercase tracking-wider mb-2">
                                        Cantidad de Números Virtuales
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={numVirtualNumbers}
                                        onChange={(e) => setNumVirtualNumbers(Math.max(1, Number(e.target.value)))}
                                        className="w-full bg-[#141A23] border border-[#1F2937] rounded-lg px-4 py-3 text-[#E8ECF1] font-sans focus:outline-none focus:border-[#008DCB] transition-colors"
                                    />
                                    <p className="text-[rgba(255,255,255,0.55)] text-xs mt-2">
                                        Total: {formatCurrency(calculations.numbersCost)} ({NUMBER_COST}€/num)
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2" title="Minutos que habla un humano (no la IA) tras un desvío a teléfono fijo.">
                                        <label className="block text-[rgba(255,255,255,0.55)] text-xs font-mono uppercase tracking-wider cursor-help">
                                            Desvío a Fijo
                                        </label>
                                        <HelpCircle size={14} className="text-[rgba(255,255,255,0.3)] hover:text-[#008DCB] transition-colors cursor-help" />
                                    </div>
                                    <input
                                        type="number"
                                        value={divertsLandline}
                                        onChange={(e) => setDivertsLandline(Number(e.target.value))}
                                        className="w-full bg-[#141A23] border border-[#1F2937] rounded-lg px-4 py-3 text-[#E8ECF1] font-sans focus:outline-none focus:border-[#008DCB] transition-colors"
                                    />
                                    <p className="text-[rgba(255,255,255,0.55)] text-xs mt-2">
                                        Total: {formatCurrency(calculations.landlineConsumption)}
                                    </p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2" title="Minutos que habla un humano (no la IA) tras un desvío a teléfono móvil.">
                                        <label className="block text-[rgba(255,255,255,0.55)] text-xs font-mono uppercase tracking-wider cursor-help">
                                            Desvío a Móvil
                                        </label>
                                        <HelpCircle size={14} className="text-[rgba(255,255,255,0.3)] hover:text-[#008DCB] transition-colors cursor-help" />
                                    </div>
                                    <input
                                        type="number"
                                        value={divertsMobile}
                                        onChange={(e) => setDivertsMobile(Number(e.target.value))}
                                        className="w-full bg-[#141A23] border border-[#1F2937] rounded-lg px-4 py-3 text-[#E8ECF1] font-sans focus:outline-none focus:border-[#008DCB] transition-colors"
                                    />
                                    <p className="text-[rgba(255,255,255,0.55)] text-xs mt-2">
                                        Total: {formatCurrency(calculations.mobileConsumption)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="note bg-[rgba(247,142,94,0.06)] border-l-4 border-[#F78E5E] p-6 rounded-r-xl">
                            <h3 className="font-mono font-bold text-sm text-[#F78E5E] mb-2">NOTA IMPORTANTE</h3>
                            <p className="text-[#E8ECF1] text-sm">
                                <strong>Mili</strong> factura el mantenimiento y los minutos de IA.
                                <br />
                                <strong>Netelip</strong> cobra directamente la numeración y los desvíos.
                            </p>
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* 1. Factura Mili */}
                        <div className="card bg-[#0E1219] border border-[#1F2937] rounded-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <Calculator size={120} />
                            </div>
                            <div className="p-6 border-b border-[#1F2937] bg-[#141A23]">
                                <h2 className="font-header font-bold text-xl text-[#008DCB]">1. Costes IA</h2>
                                <p className="text-[rgba(255,255,255,0.55)] text-sm mt-1">Servicios de Inteligencia Artificial y Mantenimiento</p>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-left text-sm">
                                    <tbody>
                                        <tr className="border-b border-[#1F2937]">
                                            <td className="py-4 px-6 text-[rgba(255,255,255,0.7)] font-sans">Mantenimiento Mensual</td>
                                            <td className="py-4 px-6 text-right font-mono text-[#E8ECF1]">{formatCurrency(MAINTENANCE_COST)}</td>
                                        </tr>
                                        <tr className="border-b border-[#1F2937]">
                                            <td className="py-4 px-6 text-[rgba(255,255,255,0.7)] font-sans">Consumo IA ({aiMinutes} min)</td>
                                            <td className="py-4 px-6 text-right font-mono text-[#E8ECF1]">{formatCurrency(calculations.aiConsumption)}</td>
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

                        {/* 2. Factura Netelip */}
                        <div className="card bg-[#0E1219] border border-[#1F2937] rounded-xl overflow-hidden opacity-90">
                            <div className="p-6 border-b border-[#1F2937] bg-[#141A23]">
                                <h2 className="font-header font-bold text-xl text-[#F78E5E]">2. Costes Directos (Netelip)</h2>
                                <p className="text-[rgba(255,255,255,0.55)] text-sm mt-1">Numeración y Telecomunicaciones</p>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-left text-sm">
                                    <tbody>
                                        <tr className="border-b border-[#1F2937]">
                                            <td className="py-4 px-6 text-[rgba(255,255,255,0.7)] font-sans">Números Virtuales ({numVirtualNumbers})</td>
                                            <td className="py-4 px-6 text-right font-mono text-[#E8ECF1]">{formatCurrency(calculations.numbersCost)}</td>
                                        </tr>
                                        <tr className="border-b border-[#1F2937]">
                                            <td className="py-4 px-6 text-[rgba(255,255,255,0.7)] font-sans flex items-center gap-2">
                                                Desvío a Humano
                                                <div title="Consumo de minutos en llamadas desviadas">
                                                    <Info size={14} className="text-[rgba(255,255,255,0.3)] cursor-help" />
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right font-mono text-[#E8ECF1]">{formatCurrency(calculations.landlineConsumption + calculations.mobileConsumption)}</td>
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

                        {/* One-time Costs */}
                        <div className="card bg-[#0E1219]/50 border border-[#1F2937] rounded-xl overflow-hidden mt-6">
                            <div className="p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-[#E8ECF1]">Pago Único (Onboarding)</h3>
                                    <p className="text-xs text-[rgba(255,255,255,0.5)]">Setup inicial y configuración</p>
                                </div>
                                <span className="font-mono font-bold text-[#E8ECF1] text-lg">{formatCurrency(calculations.onboardingTotal)}</span>
                            </div>
                        </div>

                        {/* Grand Total */}
                        <div className="p-6 rounded-xl bg-[#141A23] border border-[#1F2937] flex justify-between items-center mt-6">
                            <div>
                                <h3 className="font-header font-black text-xl text-[#E8ECF1] uppercase tracking-wider">Total Mensual Estimado</h3>
                                <p className="text-xs text-[rgba(255,255,255,0.5)]">Suma de ambas facturas (Mili + Netelip)</p>
                            </div>
                            <span className="font-header font-black text-3xl text-white">{formatCurrency(calculations.grandTotal)}</span>
                        </div>

                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
