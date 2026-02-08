"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Save, ArrowLeft, Phone, Mail, User, CreditCard,
    Bot, Calendar, Share2, Bell, ExternalLink, Key
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

interface ClientDetailProps {
    params: {
        id: string;
    }
}

export default function ClientDetail({ params }: ClientDetailProps) {
    const router = useRouter();
    const { id } = params;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [client, setClient] = useState({
        name: '',
        phone_ia: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        cost_per_minute: 0,
        api_key_retail: '',
        agent_id: '',
        workspace_name: ''
    });

    const [agent, setAgent] = useState({
        name: '',
        personality: '',
        knowledge_base: '',
        agenda_config: { type: 'google', url: '' },
        transfer_config: { number: '', who: '' },
        notice_config: { email: '', whatsapp: '' }
    });

    useEffect(() => {
        async function fetchData() {
            if (id === 'new') {
                setLoading(false);
                return;
            }

            try {
                // Fetch Client
                const { data: clientData, error: clientError } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (clientError) throw clientError;

                if (clientData) {
                    setClient(clientData);

                    // Fetch Agent
                    const { data: agentData } = await supabase
                        .from('agents')
                        .select('*')
                        .eq('client_id', id)
                        .single();

                    if (agentData) {
                        try {
                            setAgent({
                                ...agentData,
                                agenda_config: typeof agentData.agenda_config === 'string' ? JSON.parse(agentData.agenda_config) : agentData.agenda_config || { type: 'google', url: '' },
                                transfer_config: typeof agentData.transfer_config === 'string' ? JSON.parse(agentData.transfer_config) : agentData.transfer_config || { number: '', who: '' },
                                notice_config: typeof agentData.notice_config === 'string' ? JSON.parse(agentData.notice_config) : agentData.notice_config || { email: '', whatsapp: '' }
                            });
                        } catch (e) {
                            console.error("Error parsing JSON config:", e);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            let clientId = id;

            // 1. Save Client
            let clientData;

            if (id === 'new') {
                // INSERT
                const { data, error } = await supabase
                    .from('clients')
                    .insert([{ ...client }])
                    .select()
                    .single();

                if (error) throw error;
                clientData = data;
            } else {
                // UPDATE
                const { data, error } = await supabase
                    .from('clients')
                    .update({ ...client })
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;
                clientData = data;
            }

            if (!clientData || !clientData.id) {
                throw new Error("No se pudo obtener el ID del cliente guardado.");
            }

            clientId = clientData.id;

            // 2. Upsert Agent
            const agentPayload = {
                client_id: clientId,
                name: agent.name,
                personality: agent.personality,
                knowledge_base: agent.knowledge_base,
                agenda_config: agent.agenda_config,
                transfer_config: agent.transfer_config,
                notice_config: agent.notice_config
            };

            const { error: agentError } = await supabase
                .from('agents')
                .upsert(agentPayload, { onConflict: 'client_id' });

            if (agentError) throw agentError;

            alert('Guardado correctamente');
            if (id === 'new') router.push(`/clients/${clientId}`);

        } catch (error: any) {
            console.error("Error saving:", error);
            alert('Error al guardar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-full text-slate-400">Cargando...</div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-6 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between sticky top-0 bg-[#0F1115]/80 backdrop-blur-md py-4 z-10 -mx-6 px-6 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                {client.name || 'Nuevo Cliente'}
                            </h1>
                            <p className="text-sm text-slate-500">ID: {id}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Save size={18} />
                        <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Client Info & Tech */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* Client Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User size={18} className="text-blue-400" />
                                    Información Cliente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormInput label="Nombre Cliente / Empresa" value={client.name} onChange={v => setClient({ ...client, name: v })} placeholder="Ej. Clínica Dental" />
                                <FormInput label="Nombre Contacto" value={client.contact_name} onChange={v => setClient({ ...client, contact_name: v })} placeholder="Ej. Juan Pérez" />
                                <FormInput label="Email Contacto" value={client.contact_email} onChange={v => setClient({ ...client, contact_email: v })} type="email" />
                                <FormInput label="Teléfono Contacto" value={client.contact_phone} onChange={v => setClient({ ...client, contact_phone: v })} />
                                <FormInput label="Teléfono IA Asignado" value={client.phone_ia} onChange={v => setClient({ ...client, phone_ia: v })} icon={<Phone size={14} />} />
                                <FormInput label="Coste por Minuto (€)" value={client.cost_per_minute} onChange={v => setClient({ ...client, cost_per_minute: Number(v) })} type="number" />
                            </CardContent>
                        </Card>

                        {/* Technical Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key size={18} className="text-purple-400" />
                                    Configuración Técnica
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormInput label="Workspace Name" value={client.workspace_name} onChange={v => setClient({ ...client, workspace_name: v })} />
                                <FormInput label="Agent ID" value={client.agent_id} onChange={v => setClient({ ...client, agent_id: v })} fontMono />
                                <FormInput label="Retell API Key" value={client.api_key_retail} onChange={v => setClient({ ...client, api_key_retail: v })} type="password" fontMono />
                                <div className="pt-2">
                                    <a href="#" className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group border border-white/5">
                                        <span className="text-sm font-medium text-slate-300">Acceder a Retell</span>
                                        <ExternalLink size={16} className="text-slate-500 group-hover:text-white" />
                                    </a>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Client Access */}
                        <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-500/20">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-indigo-300">Panel del Cliente</h3>
                                    <p className="text-xs text-indigo-400/60">Ver métricas y KPIs</p>
                                </div>
                                <button
                                    onClick={() => window.open(`/portal/${id}`, '_blank')}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <ExternalLink size={14} />
                                    Ver Panel
                                </button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: AI Agent Config */}
                    <div className="space-y-6 lg:col-span-2">
                        <Card className="border-t-4 border-t-pink-500">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bot size={18} className="text-pink-400" />
                                    Configuración Agente IA
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput label="Nombre del Agente" value={agent.name} onChange={v => setAgent({ ...agent, name: v })} placeholder="Ej. Sofia" />
                                    <FormInput label="Personalidad" value={agent.personality} onChange={v => setAgent({ ...agent, personality: v })} placeholder="Ej. Amable, profesional..." />
                                </div>

                                {/* Info / Knowledge Base */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        Base de Conocimiento (Prompt/Info)
                                    </label>
                                    <textarea
                                        className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                                        placeholder="Pegar aquí la información base del agente..."
                                        value={agent.knowledge_base}
                                        onChange={(e) => setAgent({ ...agent, knowledge_base: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Calendar Task */}
                                    <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-2 text-orange-400 font-medium pb-2 border-b border-white/5">
                                            <Calendar size={16} />
                                            <span>Agenda / Citas</span>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs text-slate-500">Proveedor</label>
                                            <select
                                                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                                                value={agent.agenda_config.type}
                                                onChange={(e) => setAgent({ ...agent, agenda_config: { ...agent.agenda_config, type: e.target.value } })}
                                            >
                                                <option value="google">Google Calendar</option>
                                                <option value="calcom">Cal.com</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs text-slate-500">URL / Link Agendamiento</label>
                                            <input
                                                type="text"
                                                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                                                value={agent.agenda_config.url}
                                                onChange={(e) => setAgent({ ...agent, agenda_config: { ...agent.agenda_config, url: e.target.value } })}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>

                                    {/* Transfer Task */}
                                    <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-2 text-emerald-400 font-medium pb-2 border-b border-white/5">
                                            <Share2 size={16} />
                                            <span>Transferencias</span>
                                        </div>
                                        <FormInput
                                            label="Número destino"
                                            value={agent.transfer_config.number}
                                            onChange={v => setAgent({ ...agent, transfer_config: { ...agent.transfer_config, number: v } })}
                                            placeholder="+34..."
                                            compact
                                        />
                                        <FormInput
                                            label="Responsable (Quién)"
                                            value={agent.transfer_config.who}
                                            onChange={v => setAgent({ ...agent, transfer_config: { ...agent.transfer_config, who: v } })}
                                            placeholder="Recepción / Dr. X"
                                            compact
                                        />
                                    </div>

                                    {/* Notifications Task */}
                                    <div className="col-span-1 md:col-span-2 space-y-3 p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-2 text-yellow-400 font-medium pb-2 border-b border-white/5">
                                            <Bell size={16} />
                                            <span>Avisos / Notificaciones</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FormInput
                                                label="Email Avisos"
                                                value={agent.notice_config.email}
                                                onChange={v => setAgent({ ...agent, notice_config: { ...agent.notice_config, email: v } })}
                                                placeholder="avisos@empresa.com"
                                                compact
                                            />
                                            <FormInput
                                                label="WhatsApp Avisos"
                                                value={agent.notice_config.whatsapp}
                                                onChange={v => setAgent({ ...agent, notice_config: { ...agent.notice_config, whatsapp: v } })}
                                                placeholder="+34 600..."
                                                compact
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats / Invoices Placeholder */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader><CardTitle className="text-base">Facturación</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="h-32 flex items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-lg">
                                        Gráfico de Facturación (Próximamente)
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-base">Estadísticas de Llamadas</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="h-32 flex items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-lg">
                                        KPIs del Agente (Próximamente)
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// Helper Components
interface FormInputProps {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    icon?: React.ReactNode;
    compact?: boolean;
    fontMono?: boolean;
}

function FormInput({ label, value, onChange, type = "text", placeholder, icon, compact, fontMono }: FormInputProps) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">{label}</label>
            <div className="relative">
                {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</div>}
                <input
                    type={type}
                    className={`w-full bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 transition-colors
                        ${compact ? 'py-2 px-3 text-sm' : 'py-2.5 px-3'}
                        ${icon ? 'pl-9' : ''}
                        ${fontMono ? 'font-mono text-sm tracking-wide' : ''}
                    `}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        </div>
    );
}
