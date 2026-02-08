"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

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
                className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
                    {!showPreferences ? (
                        <>
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800">Notificaciones</h3>
                                <button
                                    onClick={() => setShowPreferences(true)}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Configurar
                                </button>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400 text-sm">
                                        No hay notificaciones
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => markAsRead(notif.id)}
                                            className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${!notif.read ? 'bg-blue-50/50' : ''}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-slate-800">{notif.title}</p>
                                                    <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                                                    <p className="text-xs text-slate-400 mt-2">
                                                        {new Date(notif.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                {!notif.read && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800">Preferencias de Alertas</h3>
                                <button
                                    onClick={() => setShowPreferences(false)}
                                    className="text-xs text-slate-500 hover:text-slate-700"
                                >
                                    Volver
                                </button>
                            </div>
                            <div className="p-4 space-y-4">
                                <label className="flex items-center justify-between">
                                    <span className="text-sm text-slate-700">Alertas de saldo bajo</span>
                                    <input
                                        type="checkbox"
                                        checked={preferences.email_on_low_balance}
                                        onChange={(e) => setPreferences({ ...preferences, email_on_low_balance: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                </label>

                                {preferences.email_on_low_balance && (
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Umbral de saldo (€)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="10"
                                            value={preferences.low_balance_threshold}
                                            onChange={(e) => setPreferences({ ...preferences, low_balance_threshold: parseFloat(e.target.value) })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>
                                )}

                                <label className="flex items-center justify-between">
                                    <span className="text-sm text-slate-700">Alertas de facturas</span>
                                    <input
                                        type="checkbox"
                                        checked={preferences.email_on_invoice}
                                        onChange={(e) => setPreferences({ ...preferences, email_on_invoice: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                </label>

                                <label className="flex items-center justify-between">
                                    <span className="text-sm text-slate-700">Alertas de llamadas fallidas</span>
                                    <input
                                        type="checkbox"
                                        checked={preferences.email_on_call_failure}
                                        onChange={(e) => setPreferences({ ...preferences, email_on_call_failure: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                </label>

                                <button
                                    onClick={savePreferences}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Guardar Preferencias
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
