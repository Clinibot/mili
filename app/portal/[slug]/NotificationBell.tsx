"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
}

export default function NotificationBell({ clientId }: { clientId: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [preferences, setPreferences] = useState({
        email_on_low_balance: true,
        low_balance_threshold: 50,
        email_on_invoice: true,
        email_on_call_failure: false
    });

    useEffect(() => {
        fetchNotifications();
        fetchPreferences();
    }, [clientId]);

    async function fetchNotifications() {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        }
    }

    async function fetchPreferences() {
        const { data } = await supabase
            .from('clients')
            .select('notification_preferences')
            .eq('id', clientId)
            .single();

        if (data?.notification_preferences) {
            setPreferences(data.notification_preferences);
        }
    }

    async function markAsRead(id: string) {
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        fetchNotifications();
    }

    async function savePreferences() {
        const { error } = await supabase
            .from('clients')
            .update({ notification_preferences: preferences })
            .eq('id', clientId);

        if (error) {
            toast.error('Error al guardar preferencias');
        } else {
            toast.success('Preferencias guardadas');
            setShowPreferences(false);
        }
    }

    return (
        <div className="relative">
            {/* Notification Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 hover:bg-white/5 rounded-xl transition-all duration-200 group active:scale-95"
            >
                <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-accent-coral text-white text-[10px] rounded-full flex items-center justify-center font-bold ring-2 ring-primary-dark">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-4 w-96 bg-surface-dark rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {!showPreferences ? (
                        <>
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <h3 className="font-header font-bold text-lg text-white tracking-tight">Notificaciones</h3>
                                <button
                                    onClick={() => setShowPreferences(true)}
                                    className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent-blue hover:text-white transition-colors"
                                >
                                    Ajustes
                                </button>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-12 text-center text-white/20 text-sm font-medium">
                                        Sin notificaciones nuevas
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => markAsRead(notif.id)}
                                            className={`p-6 border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer group ${!notif.read ? 'bg-accent-blue/[0.03]' : ''}`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 transition-all ${!notif.read ? 'bg-accent-blue scale-125' : 'bg-white/10'}`}></div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="text-sm font-bold text-white group-hover:text-accent-blue transition-colors leading-tight">{notif.title}</p>
                                                        <p className="text-[10px] font-mono text-white/20 ml-2 whitespace-nowrap">
                                                            {format(new Date(notif.created_at), 'HH:mm')}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-white/50 leading-relaxed mb-1">{notif.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-4 border-t border-white/5 bg-white/[0.02] text-center">
                                <button className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                                    Ver historial completo
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <h3 className="font-header font-bold text-lg text-white tracking-tight">Ajustes de Alerta</h3>
                                <button
                                    onClick={() => setShowPreferences(false)}
                                    className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <PreferenceToggle
                                    label="Saldo bajo"
                                    checked={preferences.email_on_low_balance}
                                    onChange={(v) => setPreferences({ ...preferences, email_on_low_balance: v })}
                                />

                                {preferences.email_on_low_balance && (
                                    <div className="pl-12">
                                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30 block mb-3">Umbral de activación (€)</label>
                                        <input
                                            type="number"
                                            value={preferences.low_balance_threshold}
                                            onChange={(e) => setPreferences({ ...preferences, low_balance_threshold: parseFloat(e.target.value) })}
                                            className="w-full bg-primary-dark border border-white/5 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-accent-blue/50 transition-colors"
                                        />
                                    </div>
                                )}

                                <PreferenceToggle
                                    label="Nuevas facturas"
                                    checked={preferences.email_on_invoice}
                                    onChange={(v) => setPreferences({ ...preferences, email_on_invoice: v })}
                                />

                                <PreferenceToggle
                                    label="Errores críticos"
                                    checked={preferences.email_on_call_failure}
                                    onChange={(v) => setPreferences({ ...preferences, email_on_call_failure: v })}
                                />

                                <button
                                    onClick={savePreferences}
                                    className="w-full bg-accent-blue hover:bg-accent-blue/80 text-white py-4 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-accent-blue/20 active:scale-[0.98] mt-4"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function PreferenceToggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">{label}</span>
            <div
                onClick={() => onChange(!checked)}
                className={`w-12 h-6 rounded-full transition-all relative ${checked ? 'bg-accent-blue shadow-[0_0_15px_rgba(0,141,203,0.4)]' : 'bg-white/10'}`}
            >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'left-7' : 'left-1'}`}></div>
            </div>
        </label>
    );
}
