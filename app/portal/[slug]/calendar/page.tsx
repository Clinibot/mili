"use client";

import { useEffect, useState } from 'react';
import { usePortal } from '../PortalContext';
import { supabase } from '@/lib/supabaseClient';
import {
    Calendar as CalendarIcon,
    RefreshCw,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Search,
    LogOut,
    CalendarDays
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
    };
}

export default function CalendarPage() {
    const { client, slug } = usePortal();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [syncing, setSyncing] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);

    useEffect(() => {
        if (client?.calendar_connected) {
            fetchEvents();
        } else {
            setLoading(false);
        }
    }, [client?.calendar_connected, currentMonth]);

    async function fetchEvents() {
        if (!client?.id) return;

        try {
            setSyncing(true);

            // In a real implementation, we'd have an internal proxy to Google Calendar 
            // but for the UI demo, we'll try to fetch from our list-events tool or a generic events list endpoint
            // For now, let's use the list-events logic via a server action or direct API call if we had tokens in the client
            // Since we need to refresh tokens server-side, we'll create a new API specifically for the UI to fetch events

            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);

            const res = await fetch(`/api/calendar/events?client_id=${client.id}&timeMin=${monthStart.toISOString()}&timeMax=${monthEnd.toISOString()}`);

            if (res.ok) {
                const data = await res.json();
                setEvents(data.events || []);
            } else {
                console.error('Failed to fetch events');
            }
        } catch (error) {
            console.error('Error fetching calendar events:', error);
        } finally {
            setLoading(false);
            setSyncing(false);
        }
    }

    const handleConnect = () => {
        if (!client?.id) return;
        window.location.href = `/api/calendar/auth?client_id=${client.id}`;
    };

    const handleDisconnect = async () => {
        if (!client?.id || !confirm('¿Estás seguro de que quieres desconectar Google Calendar? El agente ya no podrá gestionar tus citas.')) return;

        try {
            setDisconnecting(true);
            const res = await fetch('/api/calendar/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id: client.id })
            });

            if (res.ok) {
                toast.success('Google Calendar desconectado correctamente');
                window.location.reload();
            } else {
                toast.error('Error al desconectar');
            }
        } catch (error) {
            toast.error('Error al desconectar');
        } finally {
            setDisconnecting(false);
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    // Calendar logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    if (loading) {
        return (
            <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCw className="animate-spin text-[#008DCB]" size={32} />
                <p className="text-[#4B5563] font-bold animate-pulse">Cargando tu calendario...</p>
            </div>
        );
    }

    if (!client?.calendar_connected) {
        return (
            <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#0E1219] border border-[#1F2937] rounded-3xl p-8 lg:p-12 text-center space-y-8 shadow-2xl">
                    <div className="w-20 h-20 bg-[#008DCB]/10 rounded-3xl flex items-center justify-center mx-auto text-[#008DCB]">
                        <CalendarDays size={40} />
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-3xl lg:text-4xl font-black text-[#E8ECF1] tracking-tight">
                            Conecta tu Calendario
                        </h1>
                        <p className="text-[rgba(255,255,255,0.45)] text-lg max-w-lg mx-auto leading-relaxed">
                            Gestiona tus citas automáticamente. Al conectar Google Calendar, tu agente IA podrá consultar disponibilidad, agendar y cancelar citas por ti.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                        <div className="bg-[#141A23] p-5 rounded-2xl border border-[#1F2937]">
                            <CheckCircle2 className="text-[#008DCB] mb-3" size={20} />
                            <h4 className="text-sm font-bold text-[#E8ECF1] mb-1">Citas Automáticas</h4>
                            <p className="text-xs text-[#4B5563]">La IA agenda citas directamente en tu calendario.</p>
                        </div>
                        <div className="bg-[#141A23] p-5 rounded-2xl border border-[#1F2937]">
                            <CheckCircle2 className="text-[#008DCB] mb-3" size={20} />
                            <h4 className="text-sm font-bold text-[#E8ECF1] mb-1">Sin Conflictos</h4>
                            <p className="text-xs text-[#4B5563]">Verifica disponibilidad en tiempo real antes de confirmar.</p>
                        </div>
                        <div className="bg-[#141A23] p-5 rounded-2xl border border-[#1F2937]">
                            <CheckCircle2 className="text-[#008DCB] mb-3" size={20} />
                            <h4 className="text-sm font-bold text-[#E8ECF1] mb-1">Control Total</h4>
                            <p className="text-xs text-[#4B5563]">Visualiza todas tus citas desde este panel o tu app de Google.</p>
                        </div>
                    </div>

                    <button
                        onClick={handleConnect}
                        className="bg-[#008DCB] text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-[#008DCB]/90 transition-all active:scale-95 shadow-lg shadow-[#008DCB]/20 flex items-center justify-center gap-3 mx-auto"
                    >
                        Conectar Google Calendar
                        <ExternalLink size={20} />
                    </button>

                    <p className="text-[10px] text-[#4B5563] font-bold uppercase tracking-widest pt-4">
                        Conexión segura vía Google OAuth 2.0
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl lg:text-4xl font-black text-[#E8ECF1] tracking-tight">
                            Mi Calendario
                        </h1>
                        <span className="bg-[#22C55E]/10 text-[#22C55E] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-[#22C55E]/20 flex items-center gap-1.5 h-7">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                            Conectado
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchEvents}
                        disabled={syncing}
                        className="flex items-center gap-2 bg-[#0E1219] text-[#E8ECF1] px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#141A23] transition-all border border-[#1F2937] disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={cn(syncing && "animate-spin")} />
                        Sincronizar
                    </button>
                    <button
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        className="flex items-center gap-2 bg-[#EF4444]/10 text-[#EF4444] px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#EF4444]/20 transition-all border border-[#EF4444]/20 disabled:opacity-50"
                    >
                        <LogOut size={18} />
                        Desconectar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Main Calendar View */}
                <div className="xl:col-span-3 bg-[#0E1219] border border-[#1F2937] rounded-3xl overflow-hidden shadow-2xl">
                    {/* Calendar Header */}
                    <div className="p-6 border-b border-[#1F2937] flex items-center justify-between">
                        <h2 className="text-xl font-black text-[#E8ECF1] capitalize">
                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={previousMonth}
                                className="p-2.5 rounded-xl bg-[#141A23] border border-[#1F2937] text-[#E8ECF1] hover:bg-[#1F2937] transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => setCurrentMonth(new Date())}
                                className="px-4 py-2.5 rounded-xl bg-[#141A23] border border-[#1F2937] text-[#E8ECF1] font-bold text-sm hover:bg-[#1F2937] transition-all"
                            >
                                Hoy
                            </button>
                            <button
                                onClick={nextMonth}
                                className="p-2.5 rounded-xl bg-[#141A23] border border-[#1F2937] text-[#E8ECF1] hover:bg-[#1F2937] transition-all"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Grid Layout */}
                    <div className="grid grid-cols-7 text-center">
                        {['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map((day) => (
                            <div key={day} className="py-4 text-[10px] font-black text-[#4B5563] uppercase tracking-widest border-b border-[#1F2937] bg-[#141A23]/30">
                                {day}
                            </div>
                        ))}

                        {calendarDays.map((day, idx) => {
                            const dayEvents = events.filter(e => {
                                const eventDate = e.start.dateTime ? parseISO(e.start.dateTime) : (e.start.date ? parseISO(e.start.date) : null);
                                return eventDate && isSameDay(eventDate, day);
                            });

                            return (
                                <div
                                    key={day.toString()}
                                    className={cn(
                                        "min-h-[120px] p-2 border-b border-r border-[#1F2937] transition-colors relative group",
                                        !isSameMonth(day, monthStart) && "bg-[#070A0F]/50",
                                        isSameDay(day, new Date()) && "bg-[#008DCB]/5"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={cn(
                                            "text-xs font-bold px-2 py-1 rounded-lg",
                                            isSameDay(day, new Date()) ? "bg-[#008DCB] text-white" : "text-[#4B5563]"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 3).map((event) => (
                                            <div
                                                key={event.id}
                                                className="px-2 py-1 bg-[#141A23] border border-[#1F2937] rounded-md text-[10px] font-bold text-[#E8ECF1] truncate hover:border-[#008DCB]/50 cursor-default transition-all shadow-sm"
                                                title={event.summary}
                                            >
                                                {event.start.dateTime && format(parseISO(event.start.dateTime), 'HH:mm')} {event.summary}
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div className="text-[9px] font-black text-[#008DCB] px-1">
                                                +{dayEvents.length - 3} más
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar - Upcoming Events */}
                <div className="space-y-6">
                    <div className="bg-[#0E1219] border border-[#1F2937] rounded-3xl p-6 shadow-xl">
                        <h3 className="text-sm font-black text-[#E8ECF1] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Clock className="text-[#008DCB]" size={16} />
                            Próximas Citas
                        </h3>

                        <div className="space-y-4">
                            {events
                                .filter(e => {
                                    const eventDate = e.start.dateTime ? parseISO(e.start.dateTime) : (e.start.date ? parseISO(e.start.date) : null);
                                    return eventDate && eventDate >= new Date();
                                })
                                .sort((a, b) => {
                                    const dateA = a.start.dateTime || a.start.date || '';
                                    const dateB = b.start.dateTime || b.start.date || '';
                                    return dateA.localeCompare(dateB);
                                })
                                .slice(0, 5)
                                .map(event => (
                                    <div key={event.id} className="p-3 bg-[#141A23] rounded-2xl border border-[#1F2937] group hover:border-[#008DCB]/30 transition-all">
                                        <p className="text-xs font-black text-[#E8ECF1] line-clamp-1 mb-1 group-hover:text-[#008DCB]">
                                            {event.summary}
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#4B5563]">
                                            <CalendarIcon size={12} />
                                            {event.start.dateTime
                                                ? format(parseISO(event.start.dateTime), "d MMM, HH:mm", { locale: es })
                                                : event.start.date && format(parseISO(event.start.date), "d MMM", { locale: es })}
                                        </div>
                                    </div>
                                ))}

                            {events.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-[#141A23] rounded-full flex items-center justify-center mx-auto text-[#4B5563] mb-3">
                                        <CalendarIcon size={20} />
                                    </div>
                                    <p className="text-xs font-bold text-[#4B5563]">No hay citas próximas</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#008DCB]/10 border border-[#008DCB]/20 rounded-3xl p-6">
                        <h4 className="text-xs font-black text-[#008DCB] uppercase tracking-widest mb-2 flex items-center gap-2">
                            <AlertCircle size={14} />
                            Info Agente
                        </h4>
                        <p className="text-[11px] text-[rgba(255,255,255,0.6)] font-medium leading-relaxed">
                            Tu agente IA ya está configurado para gestionar estas citas. Los cambios que realices aquí se reflejarán instantáneamente para el agente.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Simple clock icon replacement if missing
function Clock(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
