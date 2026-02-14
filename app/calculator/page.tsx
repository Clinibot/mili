"use client";

import { useState, useMemo } from 'react';
import { Calculator, Info, HelpCircle, Code, Copy, X, Check } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';

const EMBED_CODE = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calculadora de Costes - Sonia IA & Mili Pérez</title>
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
            background-color: transparent; /* Allows embedding */
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
        
        .tooltip {
            font-size: 0.85em;
            color: var(--text-3);
            margin-top: 4px;
            line-height: 1.4;
        }

        input[type="number"], input[type="range"] {
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
        
        .range-container {
             display: flex;
             align-items: center;
             gap: 12px;
        }
        
        .range-value {
             font-family: var(--font-mono);
             color: var(--azul);
             font-weight: bold;
             min-width: 40px;
             text-align: right;
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
            display: flex;
            justify-content: space-between;
            align-items: center;
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

        .text-right { text-align: right; font-family: var(--font-mono); }
        .text-muted { color: var(--text-2); }
        
        /* Specific Colors */
        .color-mili { color: var(--azul); }
        .bg-mili { background: rgba(0,141,203,0.06); }
        .color-netelip { color: var(--coral); }
        .bg-netelip { background: rgba(247,142,94,0.06); }

    </style>
</head>
<body>

<div class="container">
    <div style="margin-bottom: 24px;">
        <h2 style="color: var(--text); margin-bottom: 5px;">Calculadora de Costes</h2>
        <p style="margin:0; font-size: 0.9em; color: var(--text-2);">Estimación basada en volumen de llamadas.</p>
    </div>

    <!-- Inputs -->
    <div class="card" style="padding: 20px;">
        <!-- Volume Inputs -->
        <div class="input-group">
            <h4 style="margin-bottom: 16px; font-size: 0.9em; color: var(--text);">Volumen y Duración</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                 <div class="input-item">
                    <label>Llamadas al Día</label>
                    <input type="number" id="callsPerDay" value="50" oninput="calculate()">
                </div>
                 <div class="input-item">
                    <label>Duración Media (Min)</label>
                    <input type="number" id="avgDuration" value="2.5" step="0.1" oninput="calculate()">
                </div>
            </div>
             <div class="input-item">
                <label>Días Laborables / Mes</label>
                <input type="number" id="workingDays" value="22" oninput="calculate()">
            </div>
             <div class="input-item">
                <label>Cantidad Números Virtuales</label>
                <input type="number" id="numVirtualNumbers" value="1" min="1" oninput="calculate()">
            </div>
        </div>
        
        <!-- Transfer Inputs -->
         <div class="input-group">
            <h4 style="margin-bottom: 16px; font-size: 0.9em; color: var(--text);">Transferencias a Humano</h4>
            
            <div class="input-item">
                <label>% Llamadas Transferidas</label>
                <div class="range-container">
                    <input type="range" id="transferRate" min="0" max="100" value="20" oninput="updateRange('transferRate', 'transferRateVal'); calculate()">
                    <span id="transferRateVal" class="range-value">20%</span>
                </div>
            </div>
            
             <div class="input-item">
                <label>% Transferencia a Móvil (vs Fijo)</label>
                <div class="range-container">
                    <input type="range" id="mobileSplit" min="0" max="100" value="80" oninput="updateRange('mobileSplit', 'mobileSplitVal'); calculate()">
                    <span id="mobileSplitVal" class="range-value">80%</span>
                </div>
                 <div class="tooltip">El resto se asume como transferencia a Fijo via Trunk SIP o similar.</div>
            </div>
            
             <div class="input-item">
                <label>Duración Media Humano (Min)</label>
                 <input type="number" id="avgHumanDuration" value="3.0" step="0.5" oninput="calculate()">
            </div>
        </div>

    </div>

    <!-- Results Split -->
    
    <!-- 1. Mili Invoice -->
    <div class="card">
        <div class="card-header">
            <h4 class="card-title color-mili">1. Costes IA</h4>
        </div>
        <table class="summary-table">
            <tr>
                <td class="text-muted">Mantenimiento Mensual</td>
                <td class="text-right">55,00 €</td>
            </tr>
            <tr>
                <td class="text-muted">
                    Consumo IA <br>
                    <span style="font-size: 0.8em; opacity: 0.6;" id="totalAiMinutes">0 min/mes</span>
                </td>
                <td class="text-right" id="aiCostOutput">0,00 €</td>
            </tr>
            <tr class="bg-mili">
                <td>
                    <div style="font-weight: bold; color: var(--text);">Total Recarga Monedero</div>
                    <div style="font-size: 10px; color: var(--azul); font-family: var(--font-mono);">COSTES IA + MANTENIMIENTO</div>
                </td>
                <td class="text-right color-mili" id="miliTotal">0,00 €</td>
            </tr>
        </table>
    </div>

    <!-- 2. Netelip Invoice -->
    <div class="card" style="opacity: 0.9;">
        <div class="card-header">
            <h4 class="card-title color-netelip">2. Costes Directos (Netelip)</h4>
        </div>
        <table class="summary-table">
            <tr>
                <td class="text-muted">Números Virtuales</td>
                <td class="text-right" id="numbersCostOutput">1,95 €</td>
            </tr>
            <tr>
                <td class="text-muted">
                    Desvío a Humano <br>
                    <span style="font-size: 0.8em; opacity: 0.6;" id="totalDivertMinutes">0 min/mes</span>
                </td>
                <td class="text-right" id="divertsCostOutput">0,00 €</td>
            </tr>
            <tr class="bg-netelip">
                <td>Total Netelip (con IVA)</td>
                <td class="text-right color-netelip" id="netelipTotal">0,00 €</td>
            </tr>
        </table>
    </div>

    <!-- Grand Total -->
    <div style="margin-top: 24px; padding: 20px; background: var(--surface-2); border-radius: 12px; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
        <div>
            <div style="text-transform: uppercase; font-weight: bold; font-family: var(--font-header); letter-spacing: 1px;">Total Mensual Estimado</div>
            <div style="font-size: 0.8em; color: var(--text-3); margin-top: 4px;">Suma de ambas facturas</div>
        </div>
        <div id="grandTotal" style="font-size: 2em; font-weight: bold; font-family: var(--font-header);">0,00 €</div>
    </div>
    
    <div style="margin-top: 15px; text-align: center;">
        <small class="text-muted" style="font-family: var(--font-mono);">Pago Único (Onboarding): <strong style="color: var(--text);">580,80 €</strong></small>
    </div>

</div>

<script>
    const MAINTENANCE = 55;
    const NUMBER = 1.95;
    const RATE_AI = 0.16;
    const RATE_LANDLINE = 0.010; // Fijo
    const RATE_MOBILE = 0.029;   // Movil
    const IVA = 0.21;

    function format(num) {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(num);
    }
    
    function updateRange(id, valId) {
        document.getElementById(valId).innerText = document.getElementById(id).value + '%';
    }

    function calculate() {
        // Inputs
        const callsPerDay = parseFloat(document.getElementById('callsPerDay').value) || 0;
        const avgDuration = parseFloat(document.getElementById('avgDuration').value) || 0;
        const workingDays = parseFloat(document.getElementById('workingDays').value) || 22;
        const numVirtual = parseFloat(document.getElementById('numVirtualNumbers').value) || 1;
        
        const transferRate = parseFloat(document.getElementById('transferRate').value) || 0;
        const mobileSplit = parseFloat(document.getElementById('mobileSplit').value) || 0; // % to mobile
        const avgHumanDuration = parseFloat(document.getElementById('avgHumanDuration').value) || 0;

        // Derived Volumes
        const totalCallsMonth = callsPerDay * workingDays;
        const totalAiMinutes = totalCallsMonth * avgDuration;
        
        const totalTransfers = totalCallsMonth * (transferRate / 100);
        const transfersMobile = totalTransfers * (mobileSplit / 100);
        const transfersLandline = totalTransfers * ((100 - mobileSplit) / 100);
        
        const humanMinutesMobile = transfersMobile * avgHumanDuration;
        const humanMinutesLandline = transfersLandline * avgHumanDuration;
        const totalHumanMinutes = humanMinutesMobile + humanMinutesLandline;

        // Mili Calc
        const aiCost = totalAiMinutes * RATE_AI;
        const miliSubtotal = MAINTENANCE + aiCost;
        const miliTotal = miliSubtotal * (1 + IVA);

        // Netelip Calc
        const numbersCost = numVirtual * NUMBER;
        const divertsCost = (humanMinutesLandline * RATE_LANDLINE) + (humanMinutesMobile * RATE_MOBILE);
        const netelipSubtotal = numbersCost + divertsCost;
        const netelipTotal = netelipSubtotal * (1 + IVA);

        const grandTotal = miliTotal + netelipTotal;

        // Output Text Updates
        document.getElementById('totalAiMinutes').innerText = Math.round(totalAiMinutes) + ' min/mes';
        document.getElementById('totalDivertMinutes').innerText = Math.round(totalHumanMinutes) + ' min/mes';

        // Output Financials
        document.getElementById('aiCostOutput').innerText = format(aiCost);
        document.getElementById('miliTotal').innerText = format(miliTotal);
        
        document.getElementById('numbersCostOutput').innerText = format(numbersCost);
        document.getElementById('divertsCostOutput').innerText = format(divertsCost);
        document.getElementById('netelipTotal').innerText = format(netelipTotal);

        document.getElementById('grandTotal').innerText = format(grandTotal);
    }

    // Init
    calculate();
</script>

</body>
</html>`;

export default function CalculatorPage() {
    // Volume Inputs
    const [callsPerDay, setCallsPerDay] = useState(50);
    const [avgDuration, setAvgDuration] = useState(2.5); // Minutes
    const [workingDays, setWorkingDays] = useState(22); // Month
    const [numVirtualNumbers, setNumVirtualNumbers] = useState(1);

    // Transfer Inputs
    const [transferRate, setTransferRate] = useState(20); // %
    const [mobileSplit, setMobileSplit] = useState(80); // % of transfers going to mobile
    const [avgHumanDuration, setAvgHumanDuration] = useState(3.0); // Minutes

    // Modal state
    const [showWidgetModal, setShowWidgetModal] = useState(false);
    const [copied, setCopied] = useState(false);

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
        // 1. Derive Volumes
        const totalCallsMonth = callsPerDay * workingDays;
        const totalAiMinutes = totalCallsMonth * avgDuration;

        const totalTransfers = totalCallsMonth * (transferRate / 100);
        const transfersMobile = totalTransfers * (mobileSplit / 100);
        const transfersLandline = totalTransfers * ((100 - mobileSplit) / 100);

        const humanMinutesMobile = transfersMobile * avgHumanDuration;
        const humanMinutesLandline = transfersLandline * avgHumanDuration;
        const totalHumanMinutes = humanMinutesMobile + humanMinutesLandline;

        // 2. Mili Costs
        const aiConsumption = totalAiMinutes * AI_MINUTE_RATE;
        const miliSubtotal = MAINTENANCE_COST + aiConsumption;
        const miliIva = miliSubtotal * IVA_RATE;
        const miliTotal = miliSubtotal + miliIva;

        // 3. Netelip Costs
        const numbersCost = numVirtualNumbers * NUMBER_COST;
        const landlineConsumption = humanMinutesLandline * DIVERT_LANDLINE_RATE;
        const mobileConsumption = humanMinutesMobile * DIVERT_MOBILE_RATE;
        const netelipSubtotal = numbersCost + landlineConsumption + mobileConsumption;
        const netelipIva = netelipSubtotal * IVA_RATE;
        const netelipTotal = netelipSubtotal + netelipIva;

        const onboardingIva = ONBOARDING_COST * IVA_RATE;
        const onboardingTotal = ONBOARDING_COST + onboardingIva;

        // Grand Total
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
            onboardingTotal,
            onboardingIva
        };
    }, [callsPerDay, avgDuration, workingDays, numVirtualNumbers, transferRate, mobileSplit, avgHumanDuration]);

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
                            Calculadora de Costes
                        </h1>
                        <p className="text-[rgba(255,255,255,0.7)] mt-2 text-lg font-sans">
                            Estimación basada en volumen de llamadas.
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
                            <h2 className="font-header font-bold text-xl text-[#E8ECF1] mb-6">Volumen y Duración</h2>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
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
                                </div>
                                <div className="grid grid-cols-2 gap-4">
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
                                    <div>
                                        <label className="block text-[rgba(255,255,255,0.55)] text-xs font-mono uppercase tracking-wider mb-2">
                                            Núm. Virtuales
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

                        {/* Group 2: Transfers */}
                        <div className="card bg-[#0E1219] border border-[#1F2937] rounded-xl p-6 shadow-sm">
                            <h2 className="font-header font-bold text-xl text-[#E8ECF1] mb-6">Transferencias a Humano</h2>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-[rgba(255,255,255,0.55)] text-xs font-mono uppercase tracking-wider">
                                            % Llamadas Transferidas
                                        </label>
                                        <span className="text-[#008DCB] font-mono font-bold text-sm">{transferRate}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={transferRate}
                                        onChange={(e) => setTransferRate(Number(e.target.value))}
                                        className="w-full accent-[#008DCB] cursor-pointer"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-[rgba(255,255,255,0.55)] text-xs font-mono uppercase tracking-wider">
                                            % Transferencia a Móvil (vs Fijo)
                                        </label>
                                        <span className="text-[#008DCB] font-mono font-bold text-sm">{mobileSplit}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={mobileSplit}
                                        onChange={(e) => setMobileSplit(Number(e.target.value))}
                                        className="w-full accent-[#008DCB] cursor-pointer"
                                    />
                                    <p className="text-[rgba(255,255,255,0.3)] text-xs mt-2">
                                        El {100 - mobileSplit}% restante se transferirá a Fijo.
                                    </p>
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
                                            <td className="py-4 px-6 text-[rgba(255,255,255,0.7)] font-sans">
                                                Consumo IA
                                                <div className="text-xs text-[rgba(255,255,255,0.4)] mt-1">
                                                    ~{Math.round(calculations.totalAiMinutes).toLocaleString()} min/mes
                                                </div>
                                            </td>
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
                                                <div className="text-xs text-[rgba(255,255,255,0.4)] ml-auto mr-2">
                                                    ~{Math.round(calculations.totalHumanMinutes).toLocaleString()} min/mes
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

                {/* Widget Modal */}
                {showWidgetModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-[#0E1219] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#1F2937] flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-[#1F2937] flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-header font-bold text-[#E8ECF1]">Widget para Web</h2>
                                    <p className="text-sm text-[rgba(255,255,255,0.55)]">Copia este código y pégalo en tu sitio web.</p>
                                </div>
                                <button
                                    onClick={() => setShowWidgetModal(false)}
                                    className="p-2 hover:bg-[#1F2937] rounded-lg transition-colors text-[rgba(255,255,255,0.5)] hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 flex-1 overflow-auto">
                                <div className="relative">
                                    <pre className="bg-[#070A0F] border border-[#1F2937] rounded-xl p-4 text-xs font-mono text-[rgba(255,255,255,0.7)] overflow-auto h-[300px] whitespace-pre-wrap select-all">
                                        {EMBED_CODE}
                                    </pre>
                                </div>
                            </div>

                            <div className="p-6 border-t border-[#1F2937] bg-[#141A23] rounded-b-2xl flex justify-end gap-3">
                                <button
                                    onClick={() => setShowWidgetModal(false)}
                                    className="px-4 py-2 text-[#E8ECF1] hover:text-white transition-colors"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={copyToClipboard}
                                    className="flex items-center gap-2 bg-[#008DCB] hover:bg-[#007AB0] text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg shadow-[#008DCB]/20"
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                    {copied ? "¡Copiado!" : "Copiar Código"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
