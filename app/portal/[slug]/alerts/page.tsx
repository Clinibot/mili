"use client";

import { useState, useEffect } from 'react';
import { usePortal } from '../PortalContext';
import { supabase } from '@/lib/supabaseClient';
import {
    Bell,
    Mail,
    Save,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Clock,
    Calendar,
    ChevronRight,
    ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotificationPreferences {
    alert_email: string;
    daily_summary: boolean;
    weekly_summary: boolean;
    email_on_low_balance?: boolean;
    low_balance_threshold?: number;
    email_on_invoice?: boolean;
}

export default function AlertsPage() {
    const { client, slug } = usePortal();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [prefs, setPrefs] = useState<NotificationPreferences>({
        alert_email: '',
        daily_summary: false,
        weekly_summary: false,
        email_on_low_balance: true,
        low_balance_threshold: 50
    });

    useEffect(() => {
        if (client) {
            // Merge with existing preferences
            const existingPrefs = client.notification_preferences || {};
            setPrefs({
                alert_email: existingPrefs.alert_email || '',
                daily_summary: !!existingPrefs.daily_summary,
                weekly_summary: !!existingPrefs.weekly_summary,
                email_on_low_balance: existingPrefs.email_on_low_balance !== false,
                low_balance_threshold: existingPrefs.low_balance_threshold || 50,
                email_on_invoice: existingPrefs.email_on_invoice !== false
            });
            setLoading(false);
        }
    }, [client]);

    const handleSave = async () => {
        if (!client) return;

        if (prefs.daily_summary || prefs.weekly_summary || prefs.monthly_summary) {
            if (!prefs.alert_email || !prefs.alert_email.includes('@')) {
                toast.error('Por favor, indica un email válido para recibir las alertas');
                return;
            }
        }

        try {
            setSaving(true);
            const { error } = await supabase
                .from('clients')
                .update({
                    notification_preferences: prefs
                })
                .eq('id', client.id);

            if (error) throw error;
            toast.success('Configuración de alertas guardada correctamente');
        } catch (error: any) {
            console.error('Error saving alerts:', error);
            toast.error('Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCw className="animate-spin text-[#008DCB]" size={32} />
                <p className="text-[#4B5563] font-bold animate-pulse">Cargando configuración...</p>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl lg:text-4xl font-black text-[#E8ECF1] tracking-tight flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#008DCB]/10 rounded-2xl flex items-center justify-center text-[#008DCB]">
                        <Bell size={28} />
                    </div>
                    Mili y son-ia Alertas
                </h1>
                <p className="text-[rgba(255,255,255,0.45)] text-lg max-w-2xl leading-relaxed">
                    Configura dónde y cuándo quieres recibir resúmenes de actividad y avisos importantes.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Destination Email */}
                    <div className="bg-[#0E1219] border border-[#1F2937] rounded-3xl p-8 space-y-6 shadow-2xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#008DCB]/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#008DCB]/10 transition-all duration-700" />

                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-[#008DCB] uppercase tracking-widest flex items-center gap-2">
                                <Mail size={16} />
                                Email de Destino
                            </h3>
                            <div className="space-y-2">
                                <p className="text-xs text-[#4B5563] font-medium">
                                    Introduce el email donde quieres recibir los reportes y alertas del sistema.
                                </p>
                                <input
                                    type="email"
                                    value={prefs.alert_email}
                                    onChange={(e) => setPrefs({ ...prefs, alert_email: e.target.value })}
                                    placeholder="ejemplo@email.com"
                                    className="w-full bg-[#141A23] border border-[#1F2937] rounded-2xl px-5 py-4 text-[#E8ECF1] font-bold outline-none focus:border-[#008DCB] transition-all placeholder:text-[#4B5563]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Summaries Configuration */}
                    <div className="bg-[#0E1219] border border-[#1F2937] rounded-3xl p-8 space-y-8 shadow-2xl">
                        <h3 className="text-sm font-black text-[#008DCB] uppercase tracking-widest flex items-center gap-2">
                            <Clock size={16} />
                            Resúmenes Automáticos
                        </h3>

                        <div className="space-y-4">
                            {/* Daily Summary */}
                            <label className={cn(
                                "flex items-center justify-between p-6 rounded-2xl border transition-all cursor-pointer group",
                                prefs.daily_summary ? "bg-[#008DCB]/5 border-[#008DCB]/30" : "bg-[#141A23] border-[#1F2937] hover:border-[#1F2937]/80"
                            )}>
                                <div className="flex gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                        prefs.daily_summary ? "bg-[#008DCB] text-white" : "bg-[#0E1219] text-[#4B5563]"
                                    )}>
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#E8ECF1]">Resumen Diario (24h)</h4>
                                        <p className="text-xs text-[#4B5563]">Recibe cada mañana un resumen de todas las llamadas del día anterior.</p>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={prefs.daily_summary}
                                    onChange={(e) => setPrefs({ ...prefs, daily_summary: e.target.checked })}
                                    className="w-6 h-6 rounded-lg accent-[#008DCB] cursor-pointer"
                                />
                            </label>

                            {/* Weekly Summary */}
                            <label className={cn(
                                "flex items-center justify-between p-6 rounded-2xl border transition-all cursor-pointer group",
                                prefs.weekly_summary ? "bg-[#008DCB]/5 border-[#008DCB]/30" : "bg-[#141A23] border-[#1F2937] hover:border-[#1F2937]/80"
                            )}>
                                <div className="flex gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                        prefs.weekly_summary ? "bg-[#008DCB] text-white" : "bg-[#0E1219] text-[#4B5563]"
                                    )}>
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#E8ECF1]">Resumen Semanal</h4>
                                        <p className="text-xs text-[#4B5563]">Recibe cada lunes un informe detallado con estadísticas de la semana.</p>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={prefs.weekly_summary}
                                    onChange={(e) => setPrefs({ ...prefs, weekly_summary: e.target.checked })}
                                    className="w-6 h-6 rounded-lg accent-[#008DCB] cursor-pointer"
                                />
                            </label>

                            {/* Monthly Summary */}
                            <label className={cn(
                                "flex items-center justify-between p-6 rounded-2xl border transition-all cursor-pointer group",
                                prefs.monthly_summary ? "bg-[#008DCB]/5 border-[#008DCB]/30" : "bg-[#141A23] border-[#1F2937] hover:border-[#1F2937]/80"
                            )}>
                                <div className="flex gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                        prefs.monthly_summary ? "bg-[#008DCB] text-white" : "bg-[#0E1219] text-[#4B5563]"
                                    )}>
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#E8ECF1]">Resumen Mensual</h4>
                                        <p className="text-xs text-[#4B5563]">Recibe el día 1 de cada mes el resumen global mensual.</p>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={prefs.monthly_summary}
                                    onChange={(e) => setPrefs({ ...prefs, monthly_summary: e.target.checked })}
                                    className="w-6 h-6 rounded-lg accent-[#008DCB] cursor-pointer"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Billing Alerts */}
                    <div className="bg-[#0E1219] border border-[#1F2937] rounded-3xl p-8 space-y-8 shadow-2xl">
                        <h3 className="text-sm font-black text-[#008DCB] uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck size={16} />
                            Alertas de Sistema y Saldo
                        </h3>

                        <div className="space-y-4">
                            {/* Low Balance */}
                            <div className="p-6 rounded-2xl bg-[#141A23] border border-[#1F2937] space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-[#0E1219] text-[#4B5563] rounded-xl flex items-center justify-center">
                                            <AlertCircle size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#E8ECF1]">Saldo Bajo</h4>
                                            <p className="text-xs text-[#4B5563]">Avísame cuando el saldo sea inferior a 10€ para que el agente no se quede sin servicio.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563] font-bold text-xs">€</span>
                                            <input
                                                type="number"
                                                value={prefs.low_balance_threshold}
                                                onChange={(e) => setPrefs({ ...prefs, low_balance_threshold: Number(e.target.value) })}
                                                className="w-20 bg-[#0E1219] border border-[#1F2937] rounded-xl pl-6 pr-3 py-2 text-xs font-black text-[#008DCB] outline-none"
                                            />
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={prefs.email_on_low_balance}
                                            onChange={(e) => setPrefs({ ...prefs, email_on_low_balance: e.target.checked })}
                                            className="w-5 h-5 rounded-lg accent-[#008DCB]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Invoices */}
                            <label className="flex items-center justify-between p-6 rounded-2xl bg-[#141A23] border border-[#1F2937] cursor-pointer">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-[#0E1219] text-[#4B5563] rounded-xl flex items-center justify-center">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#E8ECF1]">Nuevas Facturas</h4>
                                        <p className="text-xs text-[#4B5563]">Enviarme el recibo por email cada vez que recargue saldo.</p>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={prefs.email_on_invoice}
                                    onChange={(e) => setPrefs({ ...prefs, email_on_invoice: e.target.checked })}
                                    className="w-5 h-5 rounded-lg accent-[#008DCB]"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Info Panel & Actions */}
                <div className="space-y-6">
                    <div className="bg-[#008DCB]/10 border border-[#008DCB]/20 rounded-3xl p-8 space-y-6">
                        <CheckCircle2 className="text-[#008DCB]" size={32} />
                        <h4 className="text-xl font-black text-[#E8ECF1]">Todo bajo control</h4>
                        <p className="text-sm text-[rgba(255,255,255,0.6)] font-medium leading-relaxed">
                            Las alertas se envían desde <span className="text-[#008DCB] font-bold italic">alertas@centrodemando.es</span>. Asegúrate de añadir esta dirección a tus contactos para evitar que los reportes lleguen a spam.
                        </p>
                        <div className="pt-4 border-t border-[#008DCB]/10">
                            <div className="flex items-center gap-3 text-xs font-bold text-[#008DCB]">
                                <ChevronRight size={14} />
                                Resumen diario: 08:30 AM
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-[#008DCB] mt-2">
                                <ChevronRight size={14} />
                                Resumen semanal: Lunes 09:00 AM
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-[#008DCB] text-white py-5 rounded-3xl font-black text-lg hover:bg-[#008DCB]/90 transition-all active:scale-95 shadow-xl shadow-[#008DCB]/20 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {saving ? (
                            <RefreshCw className="animate-spin" size={24} />
                        ) : (
                            <>
                                <Save size={24} />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
