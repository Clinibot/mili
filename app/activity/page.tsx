"use client";

import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, User, Activity, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface ActivityLog {
    id: string;
    admin_email: string;
    action: string;
    details: string;
    created_at: string;
}

interface ChatMessage {
    id: string;
    sender_email: string;
    content: string;
    created_at: string;
}

export default function ActivityPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchUser();
        fetchLogs();
        fetchMessages();

        // Realtime subscriptions
        const logsBox = supabase
            .channel('activity_logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_activity_logs' }, payload => {
                setLogs(current => [payload.new as ActivityLog, ...current]);
            })
            .subscribe();

        const chatBox = supabase
            .channel('admin_chat')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_chat_messages' }, payload => {
                setMessages(current => [...current, payload.new as ChatMessage]);
                setTimeout(scrollToBottom, 100);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(logsBox);
            supabase.removeChannel(chatBox);
        };
    }, []);

    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserEmail(user.email || null);
    };

    const fetchLogs = async () => {
        const { data, error } = await supabase
            .from('admin_activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        if (!error && data) setLogs(data);
    };

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('admin_chat_messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(100);
        if (!error && data) {
            setMessages(data);
            setTimeout(scrollToBottom, 100);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userEmail) return;

        try {
            const { error } = await supabase
                .from('admin_chat_messages')
                .insert({
                    sender_email: userEmail,
                    content: newMessage
                });

            if (error) throw error;
            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
            toast.error('Error al enviar mensaje');
        }
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
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">

                {/* Left: Activity Feed */}
                <div className="flex-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity className="text-blue-500" />
                        <h2 className="text-xl font-bold text-slate-800">Actividad Reciente</h2>
                    </div>

                    <div className="overflow-y-auto pr-2 space-y-4 flex-1 custom-scrollbar">
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

                {/* Right: Chat */}
                <div className="flex-1 lg:max-w-md bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                        <MessageSquare className="text-green-500" />
                        <h2 className="text-lg font-bold text-slate-800">Chat de Equipo</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 custom-scrollbar">
                        {messages.length === 0 ? (
                            <p className="text-slate-400 text-center text-sm py-10">Inicia la conversación...</p>
                        ) : (
                            messages.map(msg => {
                                const isMe = msg.sender_email === userEmail;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl p-3 ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}`}>
                                            {!isMe && (
                                                <p className="text-xs font-bold text-slate-400 mb-1">{getName(msg.sender_email)}</p>
                                            )}
                                            <p className="text-sm">{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                                {format(new Date(msg.created_at), 'HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Escribe un mensaje..."
                                className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
