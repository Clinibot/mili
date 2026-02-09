"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ClientNotification } from '@/lib/notificationService';

interface Props {
    clientId: string;
}

export default function ClientNotificationBell({ clientId }: Props) {
    const [notifications, setNotifications] = useState<ClientNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();

        // Realtime subscription
        const channel = supabase
            .channel('client_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'client_notifications',
                    filter: `client_id=eq.${clientId}`
                },
                (payload) => {
                    setNotifications(current => [payload.new as ClientNotification, ...current]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [clientId]);

    useEffect(() => {
        setUnreadCount(notifications.filter(n => !n.read).length);
    }, [notifications]);

    const fetchNotifications = async () => {
        const { data, error } = await supabase
            .from('client_notifications')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (!error && data) {
            setNotifications(data);
        }
    };

    const markAsRead = async (notificationId: string) => {
        await supabase
            .from('client_notifications')
            .update({ read: true })
            .eq('id', notificationId);

        setNotifications(current =>
            current.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;

        await supabase
            .from('client_notifications')
            .update({ read: true })
            .in('id', unreadIds);

        setNotifications(current =>
            current.map(n => ({ ...n, read: true }))
        );
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
                <Bell className="w-6 h-6 text-slate-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <h3 className="font-bold text-slate-800">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                            >
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No hay notificaciones</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                    className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50/30' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-800 text-sm">
                                                {notification.title}
                                            </p>
                                            <p className="text-slate-600 text-sm mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-2">
                                                {format(new Date(notification.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
