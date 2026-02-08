"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity } from 'lucide-react';

interface ActivityLog {
    id: string;
    admin_email: string;
    action: string;
    details: string;
    created_at: string;
}

export default function ActivityPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);

    useEffect(() => {
        fetchLogs();

        // Realtime subscription
        const logsBox = supabase
            .channel('activity_logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_activity_logs' }, payload => {
                setLogs(current => [payload.new as ActivityLog, ...current]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(logsBox);
        };
    }, []);

    const fetchLogs = async () => {
        const { data, error } = await supabase
            .from('admin_activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        if (!error && data) setLogs(data);
    };

    const getAvatarColor = (email: string) => {
        if (email.includes('sonia')) return 'bg-purple-100 text-purple-600';
        if (email.includes('mili')) return 'bg-pink-100 text-pink-600';
        return 'bg-blue-100 text-blue-600';
    };

    const getName = (email: string) => {
        if (email.includes('sonia')) return 'Sonia';
        if (email.includes('mili')) return 'Mili';
        return 'Admin';
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto">
                {/* Activity Feed */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity className="text-blue-500" />
                        <h2 className="text-xl font-bold text-slate-800">Actividad Reciente</h2>
                    </div>

                    <div className="space-y-4">
                        {logs.length === 0 ? (
                            <p className="text-slate-400 text-center py-10">No hay actividad registrada aún.</p>
                        ) : (
                            logs.map(log => (
                                <div key={log.id} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 items-start">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarColor(log.admin_email)}`}>
                                        {getName(log.admin_email).substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">
                                            {getName(log.admin_email)} <span className="font-normal text-slate-500">ha realizado:</span> {log.action}
                                        </p>
                                        <p className="text-sm text-slate-600 mt-1">{log.details}</p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            {format(new Date(log.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
