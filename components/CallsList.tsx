"use client";

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';

interface CallsListProps {
    clientId?: string;
    limit?: number;
    showClientName?: boolean;
    searchQuery?: string;
}

export default function CallsList({ clientId, limit = 20, showClientName = false, searchQuery = '' }: CallsListProps) {
    const [calls, setCalls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCall, setExpandedCall] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCalls() {
            setLoading(true);
            let query = supabase
                .from('calls')
                .select('*, clients(name)')
                .order('created_at', { ascending: false });

            if (clientId) {
                query = query.eq('client_id', clientId);
            }

            if (searchQuery) {
                // Search in from_number
                query = query.ilike('from_number', `%${searchQuery}%`);
            }

            // Apply limit after filtering if it's a general list, 
            // but if searching we might want more results? 
            // For now, keep the limit.
            query = query.limit(limit);

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching calls:', error);
            } else if (data) {
                setCalls(data);
            }
            setLoading(false);
        }
        fetchCalls();
    }, [clientId, limit, searchQuery]);

    if (loading) return <div className="p-8 text-center text-[rgba(255,255,255,0.55)] font-medium underline decoration-[#008DCB]/30 underline-offset-8 decoration-2 animate-pulse">Cargando llamadas...</div>;

    if (calls.length === 0) return (
        <div className="p-12 text-center text-[rgba(255,255,255,0.3)] space-y-4">
            <div className="text-5xl opacity-20 filter grayscale">📞</div>
            <p className="font-bold text-sm tracking-widest uppercase">No hay llamadas registradas</p>
        </div>
    );

    return (
        <div className="divide-y divide-[#1F2937]/50">
            {calls.map((call) => {
                const isPlayground = !call.from_number || call.from_number.includes('playground') || call.direction === 'outbound';
                const callerDisplay = isPlayground ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#141A23] text-[rgba(255,255,255,0.45)] rounded border border-[rgba(255,255,255,0.1)] text-[9px] font-black uppercase tracking-wider">
                        Playground
                    </span>
                ) : (
                    <span className="text-sm font-bold text-[#E8ECF1] tabular-nums">{call.from_number}</span>
                );

                const clientName = call.clients?.name;

                return (
                    <div key={call.id} className="hover:bg-white/[0.02] transition-colors duration-200">
                        <div
                            className="flex items-center justify-between p-5 lg:p-6 cursor-pointer group"
                            onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                        >
                            <div className="flex items-center gap-4 lg:gap-5">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center text-xl border transition-all duration-300",
                                    call.call_successful
                                        ? "bg-[rgba(103,183,175,0.1)] text-[#67B7AF] border-[rgba(103,183,175,0.2)] shadow-[0_0_15px_rgba(103,183,175,0.1)]"
                                        : "bg-[#141A23] text-[rgba(255,255,255,0.2)] border-[#1F2937]"
                                )}>
                                    {isPlayground ? "💻" : "📱"}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5 mb-1">
                                        {callerDisplay}
                                        {call.call_successful && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#67B7AF] shadow-[0_0_8px_rgba(103,183,175,0.8)]"></span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[11px] font-bold text-[rgba(255,255,255,0.3)] tabular-nums flex items-center gap-2">
                                            {new Date(Number(call.start_timestamp)).toLocaleString('es-ES', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                        {showClientName && clientName && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-[#008DCB] uppercase tracking-tighter">
                                                <User size={10} />
                                                {clientName}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-black text-[#E8ECF1] tabular-nums">
                                        {call.duration_seconds
                                            ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`
                                            : '0s'}
                                    </span>
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center border border-[#1F2937] text-[rgba(255,255,255,0.3)] group-hover:text-[#008DCB] group-hover:border-[#008DCB]/30 transition-all",
                                        expandedCall === call.id && "bg-[#008DCB] text-[#070A0F] border-[#008DCB]"
                                    )}>
                                        {expandedCall === call.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>
                                <span className={cn(
                                    "text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-tight border",
                                    call.call_successful
                                        ? "bg-[rgba(103,183,175,0.1)] text-[#67B7AF] border-[rgba(103,183,175,0.2)]"
                                        : "bg-[rgba(247,142,94,0.1)] text-[#F78E5E] border-[rgba(247,142,94,0.2)]"
                                )}>
                                    {call.call_successful ? 'EXITOSA' : (call.call_status || 'TERMINADA')}
                                </span>
                            </div>
                        </div>

                        {expandedCall === call.id && (
                            <div className="bg-[#0b0e14] p-6 pt-2 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 border-t border-[#1F2937]/50 shadow-[inset_0_10px_30px_rgba(0,0,0,0.5)]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                                    {call.call_summary && (
                                        <div className="bg-[#0E1219] p-5 rounded-2xl border border-[#1F2937] shadow-lg relative overflow-hidden group/card">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-[#67B7AF]"></div>
                                            <p className="text-[10px] font-black text-[rgba(255,255,255,0.2)] uppercase tracking-widest mb-3">Resumen de IA</p>
                                            <p className="text-[rgba(255,255,255,0.7)] text-[13px] leading-relaxed font-medium italic">"{call.call_summary}"</p>
                                        </div>
                                    )}

                                    {call.custom_analysis_data && Object.keys(call.custom_analysis_data).length > 0 && (
                                        <div className="bg-[#0E1219] p-5 rounded-2xl border border-[#1F2937] shadow-lg relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-[#008DCB]"></div>
                                            <p className="text-[10px] font-black text-[rgba(255,255,255,0.2)] uppercase tracking-widest mb-3">Datos Extraídos</p>
                                            <div className="space-y-2.5">
                                                {Object.entries(call.custom_analysis_data).map(([key, value]: [string, any]) => (
                                                    <div key={key} className="flex justify-between items-start gap-4 border-b border-[#1F2937]/50 last:border-0 pb-2">
                                                        <span className="text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-tight">{key.replace(/_/g, ' ')}</span>
                                                        <span className="text-[11px] font-bold text-[#E8ECF1] text-right bg-[#141A23] px-2 py-0.5 rounded border border-[#1F2937]">{String(value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {call.recording_url && (
                                    <div className="bg-[#0E1219] p-5 rounded-2xl border border-[#1F2937] shadow-lg">
                                        <p className="text-[10px] font-black text-[rgba(255,255,255,0.2)] uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#F78E5E] animate-pulse"></span>
                                            Grabación de audio
                                        </p>
                                        <audio controls src={call.recording_url} className="w-full h-10 filter invert hue-rotate-180 opacity-80 hover:opacity-100 transition-opacity" />
                                    </div>
                                )}

                                {call.transcript && (
                                    <div className="bg-[#0E1219] p-6 rounded-2xl border border-[#1F2937] shadow-lg overflow-hidden">
                                        <p className="text-[10px] font-black text-[rgba(255,255,255,0.2)] uppercase tracking-widest mb-4">Transcripción completa</p>
                                        <div className="max-h-64 overflow-y-auto pr-3 text-[12px] text-[rgba(255,255,255,0.5)] leading-relaxed font-medium whitespace-pre-wrap custom-scrollbar selection:bg-[#008DCB]/30">
                                            {call.transcript}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
