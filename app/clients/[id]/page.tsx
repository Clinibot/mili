"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Save, ArrowLeft, Phone, Mail, User, CreditCard,
    Bot, Calendar, Share2, Bell, ExternalLink, Key, Lock, X, ChevronDown, ChevronUp
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export default function ClientDetail() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [client, setClient] = useState({
        name: '',
        status: 'Cliente',
        phone_ia: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        cost_per_minute: 0,
        api_key_retail: '',
        agent_id: '',
        workspace_name: '',
        webhook_token: '',
        portal_user: '',
        portal_password: '',
        slug: ''
    });

    const [agent, setAgent] = useState({
        name: '',
        personality: '',
        knowledge_base: '',
        agenda_config: { type: 'google', url: '' },
        transfer_config: [{ number: '', who: '' }] as { number: string; who: string }[],
        notice_config: { email: '', whatsapp: '' }
    });

    const [isAgentConfigExpanded, setIsAgentConfigExpanded] = useState(false);

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
                            const transfers = typeof agentData.transfer_config === 'string'
                                ? JSON.parse(agentData.transfer_config)
                                : agentData.transfer_config;

                            setAgent({
                                ...agentData,
                                agenda_config: typeof agentData.agenda_config === 'string' ? JSON.parse(agentData.agenda_config) : agentData.agenda_config || { type: 'google', url: '' },
                                transfer_config: Array.isArray(transfers) ? transfers : (transfers?.number ? [transfers] : [{ number: '', who: '' }]),
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
                const newToken = crypto.randomUUID();
                const { data, error } = await supabase
                    .from('clients')
                    .insert([{
                        ...client,
                        slug: slugify(client.name),
                        webhook_token: newToken
                    }])
                    .select()
                    .single();
                if (error) throw error;
                clientData = data;
            } else {
                // Ensure webhook_token exists even for old clients
                // And update slug based on current name
                const updatePayload = {
                    ...client,
                    slug: slugify(client.name),
                    webhook_token: client.webhook_token || crypto.randomUUID()
                };

                const { data, error } = await supabase
                    .from('clients')
                    .update(updatePayload)
                    .eq('id', id)
                    .select()
                    .single();
                if (error) throw error;
                clientData = data;
                setClient(clientData);
            }

            if (!clientData || !clientData.id) throw new Error("No ID returned");
            clientId = clientData.id;

            // 2. Upsert Agent (Manual check to avoid ON CONFLICT error)
            const agentPayload = {
                client_id: clientId,
                name: agent.name,
                personality: agent.personality,
                knowledge_base: agent.knowledge_base,
                agenda_config: agent.agenda_config,
                transfer_config: agent.transfer_config,
                notice_config: agent.notice_config
            };

            // Check if agent exists for this client
            const { data: existingAgent } = await supabase
                .from('agents')
                .select('id')
                .eq('client_id', clientId)
                .maybeSingle();

            let agentError;

            if (existingAgent) {
                // Update
                const { error } = await supabase
                    .from('agents')
                    .update(agentPayload)
                    .eq('client_id', clientId);
                agentError = error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('agents')
                    .insert([agentPayload]);
                agentError = error;
            }

            if (agentError) throw agentError;

            toast.success('Guardado correctamente');
            if (id === 'new') router.push(`/clients/${clientId}`);

        } catch (error: any) {
            console.error("Error saving:", error);
            toast.error('Error al guardar: ' + error.message);
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
                <div className="flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md py-4 z-10 -mx-6 px-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">
                                {client.name || 'Nuevo Cliente'}
                            </h1>
                            <p className="text-sm text-slate-500">ID: {id}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Save size={18} />
                        <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Client Info & Tech */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* Client Info */}
                        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-700">
                                    <User size={18} className="text-blue-500" />
                                    Información Cliente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormInput label="Nombre Cliente / Empresa" value={client.name} onChange={v => {
                                    const newSlug = client.slug || id === 'new' ? slugify(v) : client.slug;
                                    setClient({ ...client, name: v, slug: newSlug });
                                }} placeholder="Ej. Clínica Dental" />
                                <FormSelect
                                    label="Estado"
                                    value={client.status || 'Cliente'}
                                    onChange={v => setClient({ ...client, status: v })}
                                    options={[
                                        'Cliente',
                                        'Recogiendo briefing',
                                        'Implementando agente',
                                        'Entregado',
                                        'Testeo',
                                        'Mantenimiento mensual'
                                    ]}
                                />
                                <FormInput label="Slug / URL (Opcional)" value={client.slug} onChange={v => setClient({ ...client, slug: v })} placeholder="clinica-dental" fontMono />
                                <FormInput label="Nombre Contacto" value={client.contact_name} onChange={v => setClient({ ...client, contact_name: v })} placeholder="Ej. Juan Pérez" />
                                <FormInput label="Email Contacto" value={client.contact_email} onChange={v => setClient({ ...client, contact_email: v })} type="email" />
                                <FormInput label="Teléfono Contacto" value={client.contact_phone} onChange={v => setClient({ ...client, contact_phone: v })} />
                                <FormInput label="Teléfono IA Asignado" value={client.phone_ia} onChange={v => setClient({ ...client, phone_ia: v })} icon={<Phone size={14} />} />
                                <FormInput label="Coste por Minuto (€)" value={client.cost_per_minute} onChange={v => setClient({ ...client, cost_per_minute: Number(v) })} type="number" />
                            </CardContent>
                        </Card>

                        {/* Client Access - MOVED UP */}
                        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 shadow-sm rounded-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-indigo-900">
                                    <Lock size={18} className="text-indigo-600" />
                                    Acceso Panel Cliente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-indigo-800">Usuario Portal</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/50 border border-indigo-200 rounded-lg px-3 py-2 text-sm text-indigo-900 placeholder:text-indigo-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                                            placeholder="usuario.cliente"
                                            value={client.portal_user || ''}
                                            onChange={(e) => setClient({ ...client, portal_user: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-indigo-800">Contraseña Portal</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/50 border border-indigo-200 rounded-lg px-3 py-2 text-sm text-indigo-900 placeholder:text-indigo-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                                            placeholder="contraseña123"
                                            value={client.portal_password || ''}
                                            onChange={(e) => setClient({ ...client, portal_password: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="pt-2 flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-xs text-indigo-600/80">Credenciales para que el cliente acceda a su panel.</p>
                                            <p className="text-[10px] text-indigo-400">URL actual: /portal/{client.slug || id}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (saving) return;
                                                const currentSlug = client.slug || id;
                                                window.open(`/portal/${currentSlug}`, '_blank');
                                            }}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-indigo-500/20"
                                        >
                                            <ExternalLink size={14} />
                                            Ver Panel
                                        </button>
                                    </div>
                                    <p className="text-[10px] font-bold text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center gap-2">
                                        <span className="text-lg">⚠️</span>
                                        Recuerda pulsar "Guardar Cambios" arriba antes de entrar al panel si has cambiado el nombre o slug.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Technical Info - MOVED DOWN */}
                        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-700">
                                    <Key size={18} className="text-purple-500" />
                                    Configuración Técnica
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormInput label="Workspace Name" value={client.workspace_name} onChange={v => setClient({ ...client, workspace_name: v })} />
                                <FormInput label="Agent ID" value={client.agent_id} onChange={v => setClient({ ...client, agent_id: v })} fontMono />
                                <FormInput label="Retell API Key" value={client.api_key_retail} onChange={v => setClient({ ...client, api_key_retail: v })} type="password" fontMono />

                                <div className="space-y-2 pt-4 border-t border-slate-100 mt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Share2 size={14} className="text-blue-500" />
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Agent Level Webhook</label>
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                                        Copia esta URL en la sección <span className="font-bold text-slate-700">"Agent Level Webhook"</span> de tu agente en Retell para capturar estadísticas y enviar info al panel.
                                    </p>

                                    {client.webhook_token ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 pr-1">
                                                <code className="flex-1 px-2 text-[10px] font-mono text-slate-600 break-all leading-relaxed">
                                                    {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/retell?token=${client.webhook_token}` : 'URL se generará al guardar'}
                                                </code>
                                                <button
                                                    onClick={() => {
                                                        const url = `${window.location.origin}/api/webhooks/retell?token=${client.webhook_token}`;
                                                        navigator.clipboard.writeText(url);
                                                        toast.success('Webhook URL copiada');
                                                    }}
                                                    className="p-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 rounded-lg text-slate-400 transition-all shadow-sm"
                                                    title="Copiar URL"
                                                >
                                                    <ExternalLink size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100 font-medium italic">
                                            Pulsa "Guardar Cambios" para generar la URL del Webhook automáticamente.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: AI Agent Config */}
                    <div className="space-y-6 lg:col-span-2">
                        <Card className="border-t-4 border-t-pink-500 bg-white border-slate-100 shadow-sm rounded-2xl">
                            <CardHeader className="cursor-pointer" onClick={() => setIsAgentConfigExpanded(!isAgentConfigExpanded)}>
                                <CardTitle className="flex items-center justify-between text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Bot size={18} className="text-pink-500" />
                                        Configuración Agente IA
                                    </div>
                                    <button
                                        type="button"
                                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsAgentConfigExpanded(!isAgentConfigExpanded);
                                        }}
                                    >
                                        {isAgentConfigExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                    </button>
                                </CardTitle>
                            </CardHeader>
                            {isAgentConfigExpanded && (
                                <CardContent className="space-y-6 animate-in slide-in-from-top-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormInput label="Nombre del Agente" value={agent.name} onChange={v => setAgent({ ...agent, name: v })} placeholder="Ej. Sofia" />
                                        <FormInput label="Personalidad" value={agent.personality} onChange={v => setAgent({ ...agent, personality: v })} placeholder="Ej. Amable, profesional..." />
                                    </div>

                                    {/* Info / Knowledge Base */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            Base de Conocimiento (Prompt/Info)
                                        </label>
                                        <textarea
                                            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none placeholder:text-slate-400"
                                            placeholder="Pegar aquí la información base del agente..."
                                            value={agent.knowledge_base}
                                            onChange={(e) => setAgent({ ...agent, knowledge_base: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Calendar Task */}
                                        <div className="space-y-3 p-4 rounded-xl bg-orange-50/50 border border-orange-100">
                                            <div className="flex items-center gap-2 text-orange-600 font-medium pb-2 border-b border-orange-200/50">
                                                <Calendar size={16} />
                                                <span>Agenda / Citas</span>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-slate-500">Proveedor</label>
                                                <select
                                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:outline-none focus:border-orange-400"
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
                                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm text-slate-700 focus:outline-none focus:border-orange-400"
                                                    value={agent.agenda_config.url}
                                                    onChange={(e) => setAgent({ ...agent, agenda_config: { ...agent.agenda_config, url: e.target.value } })}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </div>

                                        {/* Transfer Task */}
                                        <div className="space-y-3 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                                            <div className="flex items-center justify-between text-emerald-600 font-medium pb-2 border-b border-emerald-200/50">
                                                <div className="flex items-center gap-2">
                                                    <Share2 size={16} />
                                                    <span>Transferencias</span>
                                                </div>
                                                <button
                                                    onClick={() => setAgent({ ...agent, transfer_config: [...agent.transfer_config, { number: '', who: '' }] })}
                                                    className="text-xs bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded-md transition-colors"
                                                >
                                                    + Añadir
                                                </button>
                                            </div>

                                            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                                                {agent.transfer_config.map((t, i) => (
                                                    <div key={i} className="space-y-2 pb-3 border-b border-emerald-100 last:border-0 relative group/row">
                                                        {agent.transfer_config.length > 1 && (
                                                            <button
                                                                onClick={() => setAgent({ ...agent, transfer_config: agent.transfer_config.filter((_, idx) => idx !== i) })}
                                                                type="button"
                                                                className="absolute -right-1 -top-1 p-1 text-slate-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        )}
                                                        <FormInput
                                                            label={`Número destino ${i + 1}`}
                                                            value={t.number}
                                                            onChange={v => {
                                                                const newTransfers = [...agent.transfer_config];
                                                                newTransfers[i].number = v;
                                                                setAgent({ ...agent, transfer_config: newTransfers });
                                                            }}
                                                            placeholder="+34..."
                                                            compact
                                                            bgWhite
                                                        />
                                                        <FormInput
                                                            label="Responsable"
                                                            value={t.who}
                                                            onChange={v => {
                                                                const newTransfers = [...agent.transfer_config];
                                                                newTransfers[i].who = v;
                                                                setAgent({ ...agent, transfer_config: newTransfers });
                                                            }}
                                                            placeholder="Recepción / Dr. X"
                                                            compact
                                                            bgWhite
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Notifications Task */}
                                        <div className="col-span-1 md:col-span-2 space-y-3 p-4 rounded-xl bg-yellow-50/50 border border-yellow-100">
                                            <div className="flex items-center gap-2 text-yellow-600 font-medium pb-2 border-b border-yellow-200/50">
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
                                                    bgWhite
                                                />
                                                <FormInput
                                                    label="WhatsApp Avisos"
                                                    value={agent.notice_config.whatsapp}
                                                    onChange={v => setAgent({ ...agent, notice_config: { ...agent.notice_config, whatsapp: v } })}
                                                    placeholder="+34 600..."
                                                    compact
                                                    bgWhite
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* Stats / Invoices Placeholder */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
                                <CardHeader><CardTitle className="text-base text-slate-700">Facturación</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="h-32 flex items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                                        Gráfico de Facturación (Próximamente)
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
                                <CardHeader><CardTitle className="text-base text-slate-700">Estadísticas de Llamadas</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="h-32 flex items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                                        KPIs del Agente (Próximamente)
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout >
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
    bgWhite?: boolean;
}

function FormInput({ label, value, onChange, type = "text", placeholder, icon, compact, fontMono, bgWhite }: FormInputProps) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">{label}</label>
            <div className="relative">
                {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
                <input
                    type={type}
                    className={`w-full border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-400
                        ${bgWhite ? 'bg-white' : 'bg-slate-50'}
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

function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">{label}</label>
            <select
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        </div>
    );
}

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
}
