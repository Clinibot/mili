"use client";

import { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';

export default function CalculatorPage() {
    // State for inputs
    const [aiMinutes, setAiMinutes] = useState(2000);
    const [divertsLandline, setDivertsLandline] = useState(0);
    const [divertsMobile, setDivertsMobile] = useState(0);

    // Constants
    const ONBOARDING_COST = 480;
    const MAINTENANCE_COST = 55;
    const NUMBER_COST = 1.95;
    const AI_MINUTE_RATE = 0.075;
    const DIVERT_LANDLINE_RATE = 0.010;
    const DIVERT_MOBILE_RATE = 0.029;
    const IVA_RATE = 0.21;

    // Calculations
    const calculations = useMemo(() => {
        const aiConsumption = aiMinutes * AI_MINUTE_RATE;
        const landlineConsumption = divertsLandline * DIVERT_LANDLINE_RATE;
        const mobileConsumption = divertsMobile * DIVERT_MOBILE_RATE;

        const monthlySubtotal = MAINTENANCE_COST + NUMBER_COST + aiConsumption + landlineConsumption + mobileConsumption;
        const monthlyIva = monthlySubtotal * IVA_RATE;
        const monthlyTotal = monthlySubtotal + monthlyIva;

        const onboardingIva = ONBOARDING_COST * IVA_RATE;
        const onboardingTotal = ONBOARDING_COST + onboardingIva;

        return {
            aiConsumption,
            landlineConsumption,
            mobileConsumption,
            monthlySubtotal,
            monthlyIva,
            monthlyTotal,
            onboardingTotal,
            onboardingIva
        };
    }, [aiMinutes, divertsLandline, divertsMobile]);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    return (
        <div className="p-4 lg:p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-header font-black tracking-tight text-[var(--text)] flex items-center gap-3">
                    <div className="p-2 bg-[rgba(0,141,203,0.15)] rounded-lg text-[var(--azul)]">
                        <Calculator size={24} />
                    </div>
                    Calculadora de Costes
                </h1>
                <p className="text-[var(--text-2)] mt-2 text-lg font-sans">
                    Estimación de costes basada en consumo y servicios contratados.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Inputs Section */}
                <div className="space-y-6">
                    <div className="card bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
                        <h2 className="font-header font-bold text-xl text-[var(--text)] mb-6">Configurar Consumo</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[var(--text-3)] text-xs font-mono uppercase tracking-wider mb-2">
                                    Minutos IA Mensuales
                                </label>
                                <input
                                    type="number"
                                    value={aiMinutes}
                                    onChange={(e) => setAiMinutes(Number(e.target.value))}
                                    className="w-full bg-[var(--surface-2)] border border-[var(--border-2)] rounded-lg px-4 py-3 text-[var(--text)] font-sans focus:outline-none focus:border-[var(--azul)] transition-colors"
                                />
                                <p className="text-[var(--text-3)] text-xs mt-2">
                                    Estimado: {formatCurrency(calculations.aiConsumption)} ({AI_MINUTE_RATE}€/min)
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[var(--text-3)] text-xs font-mono uppercase tracking-wider mb-2">
                                        Minutos Desvío Fijo
                                    </label>
                                    <input
                                        type="number"
                                        value={divertsLandline}
                                        onChange={(e) => setDivertsLandline(Number(e.target.value))}
                                        className="w-full bg-[var(--surface-2)] border border-[var(--border-2)] rounded-lg px-4 py-3 text-[var(--text)] font-sans focus:outline-none focus:border-[var(--azul)] transition-colors"
                                    />
                                    <p className="text-[var(--text-3)] text-xs mt-2">
                                        {formatCurrency(calculations.landlineConsumption)}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-[var(--text-3)] text-xs font-mono uppercase tracking-wider mb-2">
                                        Minutos Desvío Móvil
                                    </label>
                                    <input
                                        type="number"
                                        value={divertsMobile}
                                        onChange={(e) => setDivertsMobile(Number(e.target.value))}
                                        className="w-full bg-[var(--surface-2)] border border-[var(--border-2)] rounded-lg px-4 py-3 text-[var(--text)] font-sans focus:outline-none focus:border-[var(--azul)] transition-colors"
                                    />
                                    <p className="text-[var(--text-3)] text-xs mt-2">
                                        {formatCurrency(calculations.mobileConsumption)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="note bg-[rgba(247,142,94,0.06)] border-l-4 border-[var(--coral)] p-6 rounded-r-xl">
                        <h3 className="font-mono font-bold text-sm text-[var(--coral)] mb-2">NOTA IMPORTANTE</h3>
                        <p className="text-[var(--text-2)] text-sm">
                            El consumo de IA se factura de forma prepago a través del wallet. Los desvíos y la numeración se incluyen en la facturación recurrente.
                        </p>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="space-y-6">
                    {/* Recurring Costs */}
                    <div className="card bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-[var(--border-2)] bg-[var(--surface-2)]">
                            <h2 className="font-header font-bold text-xl text-[var(--text)]">Recurrente Mensual</h2>
                            <p className="text-[var(--text-3)] text-sm mt-1">Coste mensual estimado</p>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-left text-sm">
                                <tbody>
                                    <tr className="border-b border-[var(--border)]">
                                        <td className="py-4 px-6 text-[var(--text-2)] font-sans">Mantenimiento Agente IA</td>
                                        <td className="py-4 px-6 text-right font-mono text-[var(--text)]">{formatCurrency(MAINTENANCE_COST)}</td>
                                    </tr>
                                    <tr className="border-b border-[var(--border)]">
                                        <td className="py-4 px-6 text-[var(--text-2)] font-sans">Número Virtual (Esp)</td>
                                        <td className="py-4 px-6 text-right font-mono text-[var(--text)]">{formatCurrency(NUMBER_COST)}</td>
                                    </tr>
                                    <tr className="border-b border-[var(--border)]">
                                        <td className="py-4 px-6 text-[var(--text-2)] font-sans">Consumo IA (Estimado)</td>
                                        <td className="py-4 px-6 text-right font-mono text-[var(--text)]">{formatCurrency(calculations.aiConsumption)}</td>
                                    </tr>
                                    <tr className="border-b border-[var(--border)]">
                                        <td className="py-4 px-6 text-[var(--text-2)] font-sans">Desvíos (Estimado)</td>
                                        <td className="py-4 px-6 text-right font-mono text-[var(--text)]">{formatCurrency(calculations.landlineConsumption + calculations.mobileConsumption)}</td>
                                    </tr>
                                    <tr className="bg-[rgba(0,141,203,0.06)]">
                                        <td className="py-4 px-6 font-header font-bold text-[var(--azul)]">Total Mensual (con IVA)</td>
                                        <td className="py-4 px-6 text-right font-header font-bold text-xl text-[var(--azul)]">
                                            {formatCurrency(calculations.monthlyTotal)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* One-time Costs */}
                    <div className="card bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
                        <div className="p-4 border-b border-[var(--border-2)]">
                            <h2 className="font-header font-bold text-lg text-[var(--text)]">Pago Único (Onboarding)</h2>
                        </div>
                        <div className="p-4 flex justify-between items-center">
                            <span className="text-[var(--text-2)] font-sans">Setup, Diseño y Configuración</span>
                            <span className="font-mono font-bold text-[var(--text)]">{formatCurrency(calculations.onboardingTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 flex justify-center opacity-30">
                {/* Sello - El Procesador */}
                <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
                    <line x1="8" y1="50" x2="36" y2="50" stroke="#008DCB" strokeWidth="2.2" />
                    <line x1="36" y1="50" x2="42" y2="42" stroke="#008DCB" strokeWidth="2.2" />
                    <line x1="92" y1="50" x2="64" y2="50" stroke="#67B7AF" strokeWidth="2.2" />
                    <line x1="64" y1="50" x2="58" y2="58" stroke="#67B7AF" strokeWidth="2.2" />
                    <rect x="40" y="40" width="20" height="20" rx="2.5" stroke="#008DCB" strokeWidth="2.2" fill="none" />
                    <rect x="46" y="46" width="8" height="8" rx="1.5" fill="#F78E5E" opacity="0.85" />
                    <circle cx="8" cy="50" r="3" fill="#008DCB" />
                    <circle cx="92" cy="50" r="3" fill="#67B7AF" />
                </svg>
            </div>
        </div>
    );
}

