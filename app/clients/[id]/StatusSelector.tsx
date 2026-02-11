"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming standard cn utility is available based on previous file reads

interface StatusSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

const PRE_SALES_OPTIONS = [
    'Cita programada',
    'Presupuesto enviado',
    'Intención de compra',
    'Cliente ganado',
    'Cliente perdido'
];

const POST_SALES_OPTIONS = [
    'Recogiendo briefing',
    'Implementando agente',
    'Entregado',
    'Testeo',
    'Mantenimiento mensual'
];

export default function StatusSelector({ value, onChange }: StatusSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isPreSales = PRE_SALES_OPTIONS.includes(value);

    // Theme configurations
    const miliGradient = "from-cyan-500 via-blue-500 to-indigo-500";
    const miliText = "text-blue-600";
    const miliBg = "bg-blue-50";
    const miliBorder = "border-blue-200";

    const soniaGradient = "from-amber-400 via-orange-500 to-rose-500";
    const soniaText = "text-orange-600";
    const soniaBg = "bg-orange-50";
    const soniaBorder = "border-orange-200";

    const currentGradient = isPreSales ? miliGradient : soniaGradient;

    return (
        <div className="space-y-2" ref={containerRef}>
            <label className="text-xs font-medium text-slate-500">Estado del Lead / Pipeline</label>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full flex items-center justify-between p-1 rounded-xl border transition-all duration-300 group",
                        "hover:shadow-md active:scale-[0.99]",
                        isPreSales ? "bg-white border-blue-100" : "bg-white border-orange-100"
                    )}
                >
                    <div className={cn(
                        "flex-1 flex items-center gap-3 px-3 py-2 rounded-lg bg-gradient-to-r text-white font-bold shadow-sm transition-all duration-500",
                        currentGradient
                    )}>
                        <span className="text-sm tracking-wide">{value}</span>
                        <div className="ml-auto flex items-center gap-2 text-[10px] font-medium opacity-90 px-2 py-0.5 bg-white/20 rounded-full backdrop-blur-sm">
                            {isPreSales ? 'Preventa (Mili)' : 'Postventa (Sonia)'}
                        </div>
                    </div>
                    <div className="px-3 text-slate-400 group-hover:text-slate-600 transition-colors">
                        <ChevronDown size={18} className={cn("transition-transform duration-300", isOpen && "rotate-180")} />
                    </div>
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Mili - Pre-sales Column */}
                            <div className="space-y-2">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 pl-2 pb-1 border-b border-blue-50 mb-2">
                                    Mili (Preventa)
                                </div>
                                {PRE_SALES_OPTIONS.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            onChange(option);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group",
                                            value === option
                                                ? "bg-gradient-to-r from-cyan-50 to-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
                                                : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                                        )}
                                    >
                                        {option}
                                        {value === option && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Sonia - Post-sales Column */}
                            <div className="space-y-2">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-orange-400 pl-2 pb-1 border-b border-orange-50 mb-2">
                                    Sonia (Postventa)
                                </div>
                                {POST_SALES_OPTIONS.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            onChange(option);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group",
                                            value === option
                                                ? "bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 shadow-sm ring-1 ring-orange-200"
                                                : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                                        )}
                                    >
                                        {option}
                                        {value === option && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
                                        )}
                                    </button>
                                ))}
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
