"use client";

import { useState, useMemo } from 'react';
import { Calculator, Code, Copy, X, Check } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';

const EMBED_CODE = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calculadora de Costes IA - Sonia IA & Mili Pérez</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
    <style>
        :root {
            --azul: #008DCB;
            --coral: #F78E5E;
            --verde: #67B7AF;
            --bg: #070A0F;
            --surface: #0E1219;
            --surface-2: #141A23;
            --border: rgba(255, 255, 255, 0.06);
            --border-2: rgba(255, 255, 255, 0.1);
            --text: #E8ECF1;
            --text-2: rgba(255, 255, 255, 0.55);
            --text-3: rgba(255, 255, 255, 0.3);
            --font-sans: 'DM Sans', sans-serif;
            --font-mono: 'IBM Plex Mono', monospace;
            --font-header: 'Space Grotesk', sans-serif;
        }

        body {
            background-color: transparent;
            color: var(--text);
            font-family: var(--font-sans);
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        h1, h2, h3, h4 {
            font-family: var(--font-header);
            margin-top: 0;
        }

        .input-group {
            margin-bottom: 24px;
            padding-bottom: 24px;
            border-bottom: 1px solid var(--border);
        }
        
        .input-group:last-child {
            border-bottom: none;
            padding-bottom: 0;
            margin-bottom: 0;
        }

        .input-item {
            margin-bottom: 16px;
        }

        label {
            display: block;
            color: var(--text-2);
            font-family: var(--font-mono);
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }

        input[type="number"] {
            width: 100%;
            background: var(--surface-2);
            border: 1px solid var(--border-2);
            color: var(--text);
            padding: 12px;
            border-radius: 6px;
            font-family: var(--font-sans);
            font-size: 16px;
            box-sizing: border-box;
            transition: all 0.2s;
        }
        
        input[type="number"]:focus {
            outline: none;
            border-color: var(--azul);
        }

        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 16px;
        }

        .card-header {
            padding: 16px;
            background: var(--surface-2);
            border-bottom: 1px solid var(--border);
        }

        .card-title {
            font-size: 1.1em;
            font-weight: bold;
            margin: 0;
        }

        .summary-table {
            width: 100%;
            border-collapse: collapse;
        }

        .summary-table td {
            padding: 12px 16px;
            border-bottom: 1px solid var(--border);
            font-size: 0.9em;
        }

        .summary-table tr:last-child td {
            border-bottom: none;
            font-weight: bold;
            font-size: 1.1em;
            font-family: var(--font-header);
        }
        
        .summary-table .subtext {
            font-size: 0.75em;
            opacity: 0.5;
            display: block;
            margin-top: 4px;
        }

        .text-right { text-align: right; font-family: var(--font-mono); }
        .text-muted { color: var(--text-2); }
        
        .color-mili { color: var(--azul); }
        .bg-mili { background: rgba(0,141,203,0.06); }
        
        .onboarding-row {
            background: rgba(0,141,203,0.03); 
        }

    </style>
</head>
<body>

<div class="container">
    <div style="margin-bottom: 24px;">
        <h2 style="color: var(--text); margin-bottom: 5px;">Calculadora de Costes IA</h2>
        <p style="margin:0; font-size: 0.9em; color: var(--text-2);">Estimación de inversión en Inteligencia Artificial.</p>
    </div>

    <!-- Inputs -->
    <div class="card" style="padding: 20px;">
        <div class="input-group">
            <h4 style="margin-bottom: 16px; font-size: 0.9em; color: var(--text);">Volumen y Configuración</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                 <div class="input-item">
                    <label>Nº Agentes IA</label>
                    <input type="number" id="numAgents" value="1" min="1" oninput="calculate()">
                </div>
                 <div class="input-item">
                    <label>Llamadas al Día</label>
                    <input type="number" id="callsPerDay" value="50" oninput="calculate()">
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                 <div class="input-item">
                    <label>Duración Media IA (Min)</label>
                    <input type="number" id="avgDuration" value="2.5" step="0.1" oninput="calculate()">
                </div>
                 <div class="input-item">
                    <label>Días Laborables / Mes</label>
                    <input type="number" id="workingDays" value="22" oninput="calculate()">
                </div>
            </div>
             <div class="input-item">
                <label>Cantidad Números Virtuales</label>
                <input type="number" id="numVirtualNumbers" value="1" min="1" oninput="calculate()">
            </div>
        </div>
    </div>

    <!-- Results Split -->
    
    <!-- 1. Pago Único (Onboarding) -->
    <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
            <h4 class="card-title" style="color: var(--text);">1. Pago Único (Onboarding)</h4>
        </div>
        <table class="summary-table">
            <tr class="onboarding-row">
                 <td class="text-muted">
                    Alta por Agente <br>
                    <span class="subtext"><span id="numAgentsOutput">1</span> Agente(s) x 480€</span>
                </td>
                <td class="text-right">
                    <span id="onboardingCostOutput">480,00 €</span> <span style="font-size: 0.8em; opacity: 0.6;">+ IVA</span>
                </td>
            </tr>
        </table>
    </div>

    <!-- 2. Costes IA (Mili) -->
    <div class="card">
        <div class="card-header">
            <h4 class="card-title color-mili">2. Costes IA (Mili Pérez & Son-ia)</h4>
        </div>
        <table class="summary-table">
            <tr>
                <td class="text-muted">Mantenimiento Mensual</td>
                <td class="text-right">55,00 € <span style="font-size: 0.8em; opacity: 0.6;">+ IVA</span></td>
            </tr>
            <tr>
                <td class="text-muted">Números Virtuales</td>
                <td class="text-right"><span id="numbersCostOutput">1,95 €</span> <span style="font-size: 0.8em; opacity: 0.6;">+ IVA</span></td>
            </tr>
            <tr>
                <td class="text-muted">
                    Consumo IA <br>
                    <span style="font-size: 0.8em; opacity: 0.6;" id="totalAiMinutes">0 min/mes</span>
                </td>
                <td class="text-right"><span id="aiCostOutput">0,00 €</span> <span style="font-size: 0.8em; opacity: 0.6;">+ IVA</span></td>
            </tr>
            <tr class="bg-mili">
                <td>
                    <div style="font-weight: bold; color: var(--text);">Total Mensual Estimado</div>
                    <div style="font-size: 10px; color: var(--azul); font-family: var(--font-mono);">IVA INCLUIDO</div>
                </td>
                <td class="text-right color-mili" id="miliTotal">0,00 €</td>
            </tr>
        </table>
    </div>

</div>

<script>
    const MAINTENANCE = 55;
    const NUMBER = 1.95;
    const RATE_AI = 0.21;
    const IVA = 0.21;
    const AGENT_FEE = 480;

    function format(num) {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(num);
    }

    function calculate() {
        // Inputs
        const numAgents = Math.max(1, parseFloat(document.getElementById('numAgents').value) || 1);
        const callsPerDay = parseFloat(document.getElementById('callsPerDay').value) || 0;
        const avgDuration = parseFloat(document.getElementById('avgDuration').value) || 0;
        const workingDays = parseFloat(document.getElementById('workingDays').value) || 22;
        const numVirtual = parseFloat(document.getElementById('numVirtualNumbers').value) || 1;
        
        // Calculated Volumes
        const totalCallsMonth = callsPerDay * workingDays;
        const totalAiMinutes = totalCallsMonth * avgDuration;

        // Financials
        const onboardingCost = numAgents * AGENT_FEE;
        const numbersCost = numVirtual * NUMBER;
        const aiCost = totalAiMinutes * RATE_AI;

        const monthlySubtotal = MAINTENANCE + numbersCost + aiCost;
        const monthlyTotal = monthlySubtotal * (1 + IVA);

        // Output Text Updates
        document.getElementById('totalAiMinutes').innerText = Math.round(totalAiMinutes) + ' min/mes';
        document.getElementById('numAgentsOutput').innerText = numAgents;

        // Output Financials
        document.getElementById('onboardingCostOutput').innerText = format(onboardingCost);
        document.getElementById('numbersCostOutput').innerText = format(numbersCost);
        document.getElementById('aiCostOutput').innerText = format(aiCost);
        document.getElementById('miliTotal').innerText = format(monthlyTotal);
    }

    // Init
    calculate();
</script>

</body>
</html>`;

export default function CalculatorPage() {
    // Volume Inputs
    const [numAgents, setNumAgents] = useState(1);
    const [callsPerDay, setCallsPerDay] = useState(50);
    const [avgDuration, setAvgDuration] = useState(2.5); // Minutes
    const [workingDays, setWorkingDays] = useState(22); // Month
    const [numVirtualNumbers, setNumVirtualNumbers] = useState(1);

    // Modal state
    const [showWidgetModal, setShowWidgetModal] = useState(false);
    const [copied, setCopied] = useState(false);

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

    const copyToClipboard = () => {
        navigator.clipboard.writeText(EMBED_CODE);
        setCopied(true);
        toast.success("Código copiado al portapapeles");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <DashboardLayout>
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

                    <button
                        onClick={() => setShowWidgetModal(true)}
                        className="flex items-center gap-2 bg-[#1F2937] hover:bg-[#374151] text-[#E8ECF1] px-4 py-2 rounded-lg transition-colors font-mono text-sm border border-[#374151]"
                    >
                        <Code size={16} />
                        Generar Widget
                    </button>
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

                {/* Widget Modal */}
                {showWidgetModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-[#0E1219] border border-[#1F2937] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-[#1F2937] flex justify-between items-center bg-[#141A23]">
                                <h3 className="text-[#E8ECF1] font-header font-bold text-xl flex items-center gap-2">
                                    <Code size={20} className="text-[#008DCB]" />
                                    Código del Widget
                                </h3>
                                <button onClick={() => setShowWidgetModal(false)} className="text-[rgba(255,255,255,0.5)] hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6">
                                <p className="text-[rgba(255,255,255,0.7)] text-sm mb-4">
                                    Copia este código e insértalo en tu sitio web para mostrar la calculadora de costes.
                                </p>
                                <div className="relative">
                                    <pre className="bg-[#070A0F] border border-[#1F2937] rounded-xl p-4 text-[10px] font-mono text-[#67B7AF] overflow-x-auto h-[300px] scrollbar-thin scrollbar-thumb-[#1F2937]">
                                        {EMBED_CODE}
                                    </pre>
                                    <button
                                        onClick={copyToClipboard}
                                        className="absolute top-4 right-4 p-2 bg-[#1F2937] hover:bg-[#374151] rounded-lg text-white transition-all active:scale-95"
                                        title="Copiar código"
                                    >
                                        {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                    </button>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => setShowWidgetModal(false)}
                                        className="px-6 py-2 bg-[#008DCB] text-white rounded-lg font-bold hover:bg-[#008DCB]/90 transition-all"
                                    >
                                        Entendido
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
