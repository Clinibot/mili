"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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

function getStatusColor(status: string) {
    if (PRE_SALES_OPTIONS.includes(status)) return "bg-[#008DCB]";
    return "bg-[#F78E5E]";
}

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

    return (
        <div className="space-y-1.5" ref={containerRef}>
            <label className="text-xs font-medium text-[rgba(255,255,255,0.55)]">Estado Cliente</label>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all text-sm font-medium",
                        "bg-[#141A23] border-[#1F2937] text-[#E8ECF1] hover:border-[#008DCB]"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", getStatusColor(value))} />
                        {value}
                    </div>
                    <ChevronDown size={14} className={cn("text-[rgba(255,255,255,0.4)] transition-transform duration-200", isOpen && "rotate-180")} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#0E1219] border border-[#1F2937] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="p-2 space-y-3 max-h-80 overflow-y-auto">
                            {/* Pre-Sales Group */}
                            <div>
                                <h4 className="text-[10px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-wider px-2 mb-1.5">Ventas / Captación</h4>
                                <div className="space-y-0.5">
                                    {PRE_SALES_OPTIONS.map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                onChange(status);
                                                setIsOpen(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-colors",
                                                value === status ? "bg-[#008DCB]/10 text-[#008DCB]" : "text-[#E8ECF1] hover:bg-[#1F2937]"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(status))} />
                                                {status}
                                            </div>
                                            {value === status && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-[#1F2937] my-1" />

                            {/* Post-Sales Group */}
                            <div>
                                <h4 className="text-[10px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-wider px-2 mb-1.5">Post-Venta / Activos</h4>
                                <div className="space-y-0.5">
                                    {POST_SALES_OPTIONS.map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                onChange(status);
                                                setIsOpen(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-colors",
                                                value === status ? "bg-[#008DCB]/10 text-[#008DCB]" : "text-[#E8ECF1] hover:bg-[#1F2937]"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(status))} />
                                                {status}
                                            </div>
                                            {value === status && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
