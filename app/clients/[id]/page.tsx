"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Save, ArrowLeft, Phone, Mail, User, CreditCard,
    Bot, Calendar, Share2, Bell, ExternalLink, Key, Lock, X, ChevronDown, ChevronUp, Plus, Trash2
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { notifyBalanceRecharge } from '@/lib/notificationService';
import slugify from 'slugify'; // Assuming slugify is used based on code context
import StatusSelector from './StatusSelector';
import DocumentationSection from '@/app/portal/[slug]/DocumentationSection';
import { cn } from '@/lib/utils';

export default function ClientDetail() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [client, setClient] = useState({
        name: '',
        status: 'Cita programada',
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
        slug: '',
        balance: 0,
        notes: '',
        budget_template_url: null as string | null
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
    const [extraContacts, setExtraContacts] = useState<any[]>([]);
    const [analyticsConfigs, setAnalyticsConfigs] = useState<any[]>([]);
    const [userEmail, setUserEmail] = useState<string>('');

    useEffect(() => {
        fetchUserEmail();
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

                    // Fetch Extra Contacts
                    const { data: contactsData } = await supabase
                        .from('client_contacts')
                        .select('*')
                        .eq('client_id', id);

                    if (contactsData) {
                        setExtraContacts(contactsData);
                    }

                    // Fetch Analytics Configs
                    const { data: configsData } = await supabase
                        .from('client_analytics_configs')
                        .select('*')
                        .eq('client_id', id);

                    if (configsData) {
                        setAnalyticsConfigs(configsData);
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

    const addContactRow = () => {
        setExtraContacts([...extraContacts, { id: `temp-${Date.now()}`, name: '', role: '', email: '', phone: '' }]);
    };

    const removeContactRow = async (index: number) => {
        const contact = extraContacts[index];
        if (contact.id && !contact.id.startsWith('temp-')) {
            const { error } = await supabase.from('client_contacts').delete().eq('id', contact.id);
            if (error) {
                toast.error('Error al eliminar contacto');
                return;
            }
        }
        const newContacts = [...extraContacts];
        newContacts.splice(index, 1);
        setExtraContacts(newContacts);
    };

    const fetchUserEmail = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) setUserEmail(session.user.email);
    };

    const handleAddAnalytics = async () => {
        if (id === 'new') {
            toast.error('Guarda el cliente primero antes de añadir analíticas');
            return;
        }
        const newConfig = {
            client_id: id,
            name: 'Nueva Métrica',
            type: 'kpi',
            data_field: 'campo_webhook',
            calculation: 'count',
            is_active: true
        };

        const { data, error } = await supabase
            .from('client_analytics_configs')
            .insert([newConfig])
            .select()
            .single();

        if (error) {
            toast.error('Error al añadir configuración');
            return;
        }

        setAnalyticsConfigs([...analyticsConfigs, data]);
        toast.success('Nueva métrica añadida');
    };

    const handleDeleteAnalytics = async (configId: string) => {
        if (!confirm('¿Seguro que quieres eliminar esta métrica?')) return;

        const { error } = await supabase
            .from('client_analytics_configs')
            .delete()
            .eq('id', configId);

        if (error) {
            toast.error('Error al eliminar');
            return;
        }

        setAnalyticsConfigs(analyticsConfigs.filter(c => c.id !== configId));
        toast.success('Métrica eliminada');
    };

    const handleUpdateAnalytics = async (configId: string, updates: any) => {
        const { error } = await supabase
            .from('client_analytics_configs')
            .update(updates)
            .eq('id', configId);

        if (error) {
            toast.error('Error al actualizar');
            return;
        }

        setAnalyticsConfigs(analyticsConfigs.map(c => c.id === configId ? { ...c, ...updates } : c));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let clientId = id;

            // 1. Save Client
            let clientData;

            // Prepare sanitized payload (convert empty strings to null for unique constraints)
            const sanitizeClientPayload = (c: any) => ({
                ...c,
                portal_user: c.portal_user || null,
                portal_password: c.portal_password || null,
                budget_template_url: c.budget_template_url || null,
                notes: c.notes || null
            });

            if (id === 'new') {
                const newToken = uuidv4();
                const payload = sanitizeClientPayload({
                    ...client,
                    slug: client.slug || slugify(client.name),
                    webhook_token: newToken
                });

                const { data, error } = await supabase
                    .from('clients')
                    .insert([payload])
                    .select()
                    .single();
                if (error) throw error;
                clientData = data;
            } else {
                // Update
                const payload = sanitizeClientPayload({
                    ...client,
                    slug: client.slug || slugify(client.name),
                    webhook_token: client.webhook_token || uuidv4()
                });

                const { data, error } = await supabase
                    .from('clients')
                    .update(payload)
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

            // 3. Save Extra Contacts
            if (clientId) {
                const contactsToUpsert = extraContacts.map(c => {
                    // Base payload
                    const payload: any = {
                        client_id: clientId,
                        name: c.name,
                        role: c.role,
                        email: c.email,
                        phone: c.phone
                    };

                    // Only include ID if it's a real UUID (not a temp one)
                    if (c.id && !c.id.startsWith('temp-')) {
                        payload.id = c.id;
                    }

                    return payload;
                });

                if (contactsToUpsert.length > 0) {
                    const { error: contactsError } = await supabase
                        .from('client_contacts')
                        .upsert(contactsToUpsert); // Upsert handles both insert (no ID) and update (with ID)

                    if (contactsError) throw contactsError;

                    // Refresh contacts to get real IDs for new items
                    const { data: refreshedContacts } = await supabase
                        .from('client_contacts')
                        .select('*')
                        .eq('client_id', clientId);

                    if (refreshedContacts) {
                        setExtraContacts(refreshedContacts);
                    }
                }
            }

            toast.success('Guardado correctamente');

            if (id === 'new') {
                router.push('/');
            }
        } catch (error: any) {
            console.error("Error saving:", error);
            toast.error('Error al guardar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-full text-[rgba(255,255,255,0.3)]">Cargando...</div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-6 pb-20">
                {/* Header */}
                <div className="flex items-center justify-between sticky top-0 bg-[#0E1219]/80 backdrop-blur-md py-4 z-10 -mx-6 px-6 border-b border-[#1F2937]">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-[#141A23] rounded-xl transition-colors text-[rgba(255,255,255,0.3)] hover:text-[#E8ECF1]">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black font-header text-[#E8ECF1] tracking-tight">
                                {client.name || 'Nuevo Cliente'}
                            </h1>
                            <p className="text-sm font-mono text-[rgba(255,255,255,0.4)]">ID: {id}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-[#008DCB] hover:bg-[#008DCB]/90 text-[#070A0F] px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-[#008DCB]/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* Client Access - FIRST POSITION */}
                        <Card className="bg-[#0E1219] border-[#1F2937] shadow-xl shadow-black/20 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-[#E8ECF1]">
                                    <Lock size={18} className="text-[rgba(255,255,255,0.55)]" />
                                    Acceso Panel Cliente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-[rgba(255,255,255,0.55)]">Usuario Portal</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#141A23] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#E8ECF1] placeholder:text-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#008DCB] focus:ring-1 focus:ring-[#008DCB]/20"
                                            placeholder="usuario.cliente"
                                            value={client.portal_user || ''}
                                            onChange={(e) => setClient({ ...client, portal_user: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-[rgba(255,255,255,0.55)]">Contraseña Portal</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#141A23] border border-[#1F2937] rounded-lg px-3 py-2 text-sm text-[#E8ECF1] placeholder:text-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[#008DCB] focus:ring-1 focus:ring-[#008DCB]/20"
                                            placeholder="contraseña123"
                                            value={client.portal_password || ''}
                                            onChange={(e) => setClient({ ...client, portal_password: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="pt-2 flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-xs text-[rgba(255,255,255,0.55)]">Credenciales para que el cliente acceda a su panel.</p>
                                            <p className="text-[10px] text-[rgba(255,255,255,0.4)]">URL actual: /portal/{client.slug || id}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (saving) return;
                                                const currentSlug = client.slug || id;
                                                window.open(`/portal/${currentSlug}`, '_blank');
                                            }}
                                            className="px-4 py-2 bg-[#141A23] hover:bg-[#1F2937] text-[#E8ECF1] text-sm rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-black/20 border border-[#1F2937]"
                                        >
                                            <ExternalLink size={14} />
                                            Ver Panel
                                        </button>
                                    </div>
                                    <p className="text-[10px] font-bold text-[#F78E5E] bg-[#F78E5E]/10 p-2 rounded-lg border border-[#F78E5E]/20 flex items-center gap-2">
                                        <span className="text-lg">⚠️</span>
                                        Recuerda pulsar "Guardar Cambios" arriba antes de entrar al panel si has cambiado el nombre o slug.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>


                        {/* Budget Template Card */}
                        <Card className="bg-[#0E1219] border-[#1F2937] shadow-xl shadow-black/20 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-[#E8ECF1]">
                                    <div className="p-2 bg-[#F78E5E]/10 rounded-lg text-[#F78E5E]">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <line x1="10" y1="9" x2="8" y2="9"></line>
                                        </svg>
                                    </div>
                                    Plantilla Presupuesto
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-[rgba(255,255,255,0.55)]">Sube aquí el presupuesto o plantilla PDF/Doc para este cliente.</p>

                                {client.budget_template_url ? (
                                    <div className="flex items-center gap-3 p-3 bg-[#141A23] border border-[#1F2937] rounded-xl">
                                        <div className="p-2 bg-[#0E1219] rounded-lg border border-[#1F2937] shadow-sm text-[#F78E5E]">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[#E8ECF1] truncate">Presupuesto_Cliente.pdf</p>
                                            <a
                                                href={client.budget_template_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-[#008DCB] hover:text-[#008DCB]/80 hover:underline flex items-center gap-1 mt-0.5"
                                            >
                                                Ver / Descargar
                                                <ExternalLink size={10} />
                                            </a>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (!confirm('¿Estás segura de que quieres eliminar el presupuesto actual?')) return;

                                                try {
                                                    // 1. Remove from DB
                                                    const { error: dbError } = await supabase
                                                        .from('clients')
                                                        .update({ budget_template_url: null })
                                                        .eq('id', id);

                                                    if (dbError) throw dbError;

                                                    // 2. Remove from Storage (Optional/Advanced: extraction from URL logic needed)
                                                    // keeping it simple: just unlinking from client for now.

                                                    setClient({ ...client, budget_template_url: null });
                                                    toast.success('Presupuesto eliminado');
                                                } catch (error) {
                                                    console.error('Error removing budget:', error);
                                                    toast.error('Error al eliminar');
                                                }
                                            }}
                                            className="p-2 hover:bg-[#1F2937] rounded-lg text-[rgba(255,255,255,0.3)] hover:text-[#F78E5E] transition-colors"
                                            title="Eliminar"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        <div className="border-2 border-dashed border-[#1F2937] rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-[rgba(255,255,255,0.3)] group-hover:border-[#008DCB] group-hover:bg-[#008DCB]/5 transition-all cursor-pointer">
                                            <div className="p-3 bg-[#141A23] rounded-full group-hover:bg-[#008DCB]/20 transition-colors">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[rgba(255,255,255,0.4)] group-hover:text-[#008DCB]">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                    <polyline points="17 8 12 3 7 8"></polyline>
                                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                                </svg>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-[rgba(255,255,255,0.55)] group-hover:text-[#008DCB]">Subir presupuesto</p>
                                                <p className="text-xs text-[rgba(255,255,255,0.3)]">PDF, DOCX, IMG (Max 5MB)</p>
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                const toastId = toast.loading('Subiendo presupuesto...');

                                                try {
                                                    const fileExt = file.name.split('.').pop();
                                                    const fileName = `budget_${id}_${Date.now()}.${fileExt}`;
                                                    const filePath = `${fileName}`;

                                                    const { error: uploadError } = await supabase.storage
                                                        .from('documentation')
                                                        .upload(filePath, file);

                                                    if (uploadError) throw uploadError;

                                                    const { data: { publicUrl } } = supabase.storage
                                                        .from('documentation')
                                                        .getPublicUrl(filePath);

                                                    // Only update DB immediately if client already exists
                                                    if (id !== 'new') {
                                                        const { error: dbError } = await supabase
                                                            .from('clients')
                                                            .update({ budget_template_url: publicUrl })
                                                            .eq('id', id);

                                                        if (dbError) throw dbError;
                                                    }

                                                    setClient({ ...client, budget_template_url: publicUrl });
                                                    toast.success(id === 'new' ? 'Presupuesto adjunto (Guarda para confirmar)' : 'Presupuesto subido correctamente', { id: toastId });
                                                } catch (error) {
                                                    console.error('Error uploading budget:', error);
                                                    toast.error('Error al subir el presupuesto', { id: toastId });
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Documentation Section */}
                        {id !== 'new' && (
                            <div className="mt-6">
                                <DocumentationSection clientId={id} />
                            </div>
                        )}

                        {/* Gift Balance - Admin Only */}
                        <Card className="bg-[#0E1219] border-[#1F2937] shadow-xl shadow-black/20 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-[#E8ECF1]">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#67B7AF]">
                                        <rect x="3" y="8" width="18" height="4" rx="1"></rect>
                                        <path d="M12 8v13"></path>
                                        <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path>
                                        <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path>
                                    </svg>
                                    Regalar Saldo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-xs text-[#67B7AF]">Añade saldo gratis al monedero del cliente como regalo o crédito promocional.</p>
                                <div className="flex gap-3">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#67B7AF] font-bold">€</span>
                                        <input
                                            type="number"
                                            min="1"
                                            step="5"
                                            placeholder="0.00"
                                            className="w-full bg-[#141A23] border border-[#67B7AF]/30 rounded-lg pl-8 pr-3 py-2.5 text-[#E8ECF1] font-bold placeholder:text-[rgba(255,255,255,0.2)] focus:outline-none focus:border-[#67B7AF] focus:ring-2 focus:ring-[#67B7AF]/20"
                                            id="giftAmount"
                                        />
                                    </div>
                                    <button
                                        onClick={async () => {
                                            const input = document.getElementById('giftAmount') as HTMLInputElement;
                                            const amount = parseFloat(input.value);

                                            if (!amount || amount <= 0) {
                                                toast.error('Introduce una cantidad válida');
                                                return;
                                            }

                                            try {
                                                // Actualizar balance
                                                const currentBalance = client.balance || 0;
                                                const newBalance = currentBalance + amount;

                                                const { error: updateError } = await supabase
                                                    .from('clients')
                                                    .update({ balance: newBalance })
                                                    .eq('id', id);

                                                if (updateError) throw updateError;

                                                // Registrar transacción
                                                await supabase.from('transactions').insert({
                                                    client_id: id,
                                                    amount,
                                                    type: 'gift',
                                                    status: 'completed',
                                                    description: `Regalo de saldo por administrador: €${amount}`
                                                });

                                                // Actualizar estado local
                                                setClient({ ...client, balance: newBalance });

                                                // Enviar notificación al cliente
                                                await notifyBalanceRecharge(
                                                    id,
                                                    client.contact_email,
                                                    amount,
                                                    newBalance
                                                );

                                                toast.success(`¡€${amount} regalados! Nuevo balance: €${newBalance.toFixed(2)}`);
                                                input.value = '';
                                            } catch (error) {
                                                console.error('Error gifting balance:', error);
                                                toast.error('Error al regalar saldo');
                                            }
                                        }}
                                        className="px-6 py-2.5 bg-[#141A23] hover:bg-[#1F2937] text-[#E8ECF1] text-sm font-bold rounded-lg transition-all shadow-md shadow-black/20 flex items-center gap-2 whitespace-nowrap border border-[#1F2937]"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 5v14M5 12h14"></path>
                                        </svg>
                                        Regalar
                                    </button>
                                </div>
                                <div className="text-xs text-[rgba(255,255,255,0.55)] bg-[#141A23] px-3 py-2 rounded-lg border border-[#1F2937]">
                                    <strong>Balance actual:</strong> €{(client.balance || 0).toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Budget Template + AI Agent Config + Technical Config */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Client Info (Moved from Left Column) */}
                        <Card className="bg-[#0E1219] border-[#1F2937] shadow-xl shadow-black/20 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-[#E8ECF1]">
                                    <User size={18} className="text-[#008DCB]" />
                                    Información Cliente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormInput label="Nombre Cliente / Empresa" value={client.name} onChange={v => {
                                    setClient({ ...client, name: v });
                                }} placeholder="Ej. Clínica Dental" />
                                <StatusSelector
                                    value={client.status || 'Cita programada'}
                                    onChange={v => setClient({ ...client, status: v })}
                                />
                                <FormInput label="Slug / URL (Opcional)" value={client.slug} onChange={v => setClient({ ...client, slug: v })} placeholder="clinica-dental" fontMono />
                                <FormInput label="Nombre Contacto" value={client.contact_name} onChange={v => setClient({ ...client, contact_name: v })} placeholder="Ej. Juan Pérez" />
                                <FormInput label="Email Contacto" value={client.contact_email} onChange={v => setClient({ ...client, contact_email: v })} type="email" />
                                <FormInput label="Teléfono Contacto" value={client.contact_phone} onChange={v => setClient({ ...client, contact_phone: v })} />
                                <FormInput label="Teléfono IA Asignado" value={client.phone_ia} onChange={v => setClient({ ...client, phone_ia: v })} icon={<Phone size={14} />} />
                                <FormInput label="Coste por Minuto (€)" value={client.cost_per_minute} onChange={v => setClient({ ...client, cost_per_minute: Number(v) })} type="number" />

                                {/* Multiple Contacts Section */}
                                <div className="col-span-full pt-4 border-t border-[#1F2937]">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-semibold text-[rgba(255,255,255,0.7)] uppercase tracking-wider">Contactos Adicionales</h3>
                                        <button
                                            type="button"
                                            onClick={addContactRow}
                                            className="text-xs flex items-center gap-1.5 bg-[#008DCB]/10 text-[#008DCB] px-2.5 py-1.5 rounded-lg hover:bg-[#008DCB]/20 transition-colors"
                                        >
                                            <Plus size={14} />
                                            Añadir
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {extraContacts.map((contact, index) => (
                                            <div key={contact.id || index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start animate-in slide-in-from-top-1 bg-[#141A23] p-2 rounded-lg border border-[#1F2937]">
                                                <div className="md:col-span-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Nombre"
                                                        className="w-full bg-[#0E1219] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-xs text-[#E8ECF1] placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#008DCB] focus:outline-none"
                                                        value={contact.name || ''}
                                                        onChange={e => {
                                                            const newContacts = [...extraContacts];
                                                            newContacts[index].name = e.target.value;
                                                            setExtraContacts(newContacts);
                                                        }}
                                                    />
                                                </div>
                                                <div className="md:col-span-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Rol (ej. Técnico)"
                                                        className="w-full bg-[#0E1219] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-xs text-[#E8ECF1] placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#008DCB] focus:outline-none"
                                                        value={contact.role || ''}
                                                        onChange={e => {
                                                            const newContacts = [...extraContacts];
                                                            newContacts[index].role = e.target.value;
                                                            setExtraContacts(newContacts);
                                                        }}
                                                    />
                                                </div>
                                                <div className="md:col-span-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Email"
                                                        className="w-full bg-[#0E1219] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-xs text-[#E8ECF1] placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#008DCB] focus:outline-none"
                                                        value={contact.email || ''}
                                                        onChange={e => {
                                                            const newContacts = [...extraContacts];
                                                            newContacts[index].email = e.target.value;
                                                            setExtraContacts(newContacts);
                                                        }}
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Teléfono"
                                                        className="w-full bg-[#0E1219] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-xs text-[#E8ECF1] placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#008DCB] focus:outline-none"
                                                        value={contact.phone || ''}
                                                        onChange={e => {
                                                            const newContacts = [...extraContacts];
                                                            newContacts[index].phone = e.target.value;
                                                            setExtraContacts(newContacts);
                                                        }}
                                                    />
                                                </div>
                                                <div className="md:col-span-1 flex justify-center pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeContactRow(index)}
                                                        className="p-1 text-[rgba(255,255,255,0.3)] hover:text-[#F78E5E] hover:bg-[#F78E5E]/10 rounded-md transition-colors"
                                                        title="Eliminar contacto"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {extraContacts.length === 0 && (
                                            <p className="text-xs text-[rgba(255,255,255,0.3)] italic text-center py-2 border border-dashed border-[#1F2937] rounded-lg">No hay contactos adicionales</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-2 border-t border-[#1F2937] mt-2">
                                    <label className="text-xs font-medium text-[rgba(255,255,255,0.55)]">Notas / Información Recopilada</label>
                                    <textarea
                                        className="w-full h-32 bg-[#141A23] border border-[#1F2937] rounded-lg p-3 text-sm text-[#E8ECF1] focus:outline-none focus:border-[#008DCB] focus:ring-1 focus:ring-[#008DCB]/20 transition-all resize-y placeholder:text-[rgba(255,255,255,0.3)]"
                                        placeholder="Escribe aquí toda la información recopilada del cliente, resumen de llamadas, detalles a tener en cuenta..."
                                        value={client.notes || ''}
                                        onChange={(e) => setClient({ ...client, notes: e.target.value })}
                                    />
                                    <p className="text-[10px] text-[rgba(255,255,255,0.3)]">Esta información es privada para los administradores.</p>
                                </div>
                            </CardContent>
                        </Card>


                        {/* Custom Analytics Config - Admin Only */}
                        {id !== 'new' && (
                            <Card className="bg-[#0E1219] border-[#1F2937] shadow-xl shadow-black/20 rounded-2xl">
                                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#1F2937]/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[#008DCB]/10 rounded-lg">
                                            <Bot className="text-[#008DCB]" size={20} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-[#E8ECF1] text-lg tracking-tight">Analíticas Personalizadas (Webhook Arguments)</CardTitle>
                                            <p className="text-[10px] text-[rgba(255,255,255,0.4)] font-medium uppercase tracking-widest mt-1">Configura KPIs y gráficos para el panel del cliente</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAddAnalytics}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#008DCB] hover:bg-[#008DCB]/80 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-[#008DCB]/20"
                                    >
                                        <Plus size={14} />
                                        Añadir Métrica
                                    </button>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="bg-[#141A23] border border-[#008DCB]/20 p-4 rounded-xl flex gap-3">
                                        <div className="text-[#008DCB] pt-0.5">
                                            <Bell size={16} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-[#E8ECF1]">Cómo funciona:</p>
                                            <p className="text-[11px] text-[rgba(255,255,255,0.6)] leading-relaxed">
                                                Cuando el agente termina una llamada, envía los <strong>Arguments</strong> (ej. <code>cita_agendada</code>, <code>presupuesto_aceptado</code>) al webhook.
                                                Usa el nombre exacto de esos campos en <span className="text-[#008DCB] font-mono">Campo Webhook</span> para generar KPIs o gráficos automáticamente en el portal del cliente.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {analyticsConfigs.length === 0 ? (
                                            <div className="col-span-full text-center py-12 border-2 border-dashed border-[#1F2937] rounded-2xl bg-[#070A0F]/30">
                                                <Bot size={40} className="mx-auto text-[rgba(255,255,255,0.1)] mb-4" />
                                                <p className="text-[11px] text-[rgba(255,255,255,0.3)] uppercase tracking-[0.2em] font-black">No hay analíticas configuradas aún</p>
                                                <button
                                                    onClick={handleAddAnalytics}
                                                    className="mt-4 text-[#008DCB] text-xs font-bold hover:underline"
                                                >
                                                    Haz clic en "Añadir Métrica" para empezar
                                                </button>
                                            </div>
                                        ) : (
                                            analyticsConfigs.map((config) => (
                                                <div key={config.id} className="p-5 bg-[#141A23] border border-[#1F2937] rounded-2xl space-y-4 relative group hover:border-[#008DCB]/30 transition-all shadow-lg">
                                                    <button
                                                        onClick={() => handleDeleteAnalytics(config.id)}
                                                        className="absolute top-4 right-4 p-2 text-[rgba(255,255,255,0.2)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>

                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-1 gap-4">
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-wider">Nombre en el Panel (Ej: Citas)</label>
                                                                <input
                                                                    type="text"
                                                                    value={config.name}
                                                                    onChange={(e) => handleUpdateAnalytics(config.id, { name: e.target.value })}
                                                                    className="w-full bg-[#0E1219] border border-[#1F2937] rounded-xl px-3 py-2 text-sm text-[#E8ECF1] focus:border-[#008DCB] outline-none font-bold"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[10px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-wider">Campo Webhook (Argument Name)</label>
                                                                <input
                                                                    type="text"
                                                                    value={config.data_field}
                                                                    onChange={(e) => handleUpdateAnalytics(config.id, { data_field: e.target.value })}
                                                                    placeholder="Ej: cita_agendada"
                                                                    className="w-full bg-[#0E1219] border border-[#1F2937] rounded-xl px-3 py-2 text-sm text-[#008DCB] focus:border-[#008DCB] outline-none font-mono font-bold"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#1F2937]/50">
                                                            <div className="space-y-1.5">
                                                                <label className="text-[9px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-tight">Tipo</label>
                                                                <select
                                                                    value={config.type}
                                                                    onChange={(e) => handleUpdateAnalytics(config.id, { type: e.target.value })}
                                                                    className="w-full bg-[#0E1219] border border-[#1F2937] rounded-lg px-2 py-1.5 text-xs text-[#E8ECF1] outline-none font-bold"
                                                                >
                                                                    <option value="kpi">KPI</option>
                                                                    <option value="chart">Gráfico</option>
                                                                </select>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[9px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-tight">Cálculo</label>
                                                                <select
                                                                    value={config.calculation}
                                                                    onChange={(e) => handleUpdateAnalytics(config.id, { calculation: e.target.value })}
                                                                    className="w-full bg-[#0E1219] border border-[#1F2937] rounded-lg px-2 py-1.5 text-xs text-[#E8ECF1] outline-none font-bold"
                                                                >
                                                                    <option value="count">Contar</option>
                                                                    <option value="sum">Sumar</option>
                                                                    <option value="avg">Medio</option>
                                                                    <option value="percentage"> % </option>
                                                                </select>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-[9px] font-black text-[rgba(255,255,255,0.3)] uppercase tracking-tight">
                                                                    {config.type === 'chart' ? 'Gráfico' : 'Estado'}
                                                                </label>
                                                                {config.type === 'chart' ? (
                                                                    <select
                                                                        value={config.chart_type}
                                                                        onChange={(e) => handleUpdateAnalytics(config.id, { chart_type: e.target.value })}
                                                                        className="w-full bg-[#0E1219] border border-[#1F2937] rounded-lg px-2 py-1.5 text-xs text-[#E8ECF1] outline-none font-bold"
                                                                    >
                                                                        <option value="bar">Barras</option>
                                                                        <option value="area">Área</option>
                                                                        <option value="line">Línea</option>
                                                                        <option value="pie">Tarta</option>
                                                                    </select>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleUpdateAnalytics(config.id, { is_active: !config.is_active })}
                                                                        className={cn(
                                                                            "w-full rounded-lg px-2 py-1.5 text-[9px] font-black uppercase transition-all",
                                                                            config.is_active ? "bg-[#67B7AF]/10 text-[#67B7AF] border border-[#67B7AF]/30" : "bg-red-500/10 text-red-500 border border-red-500/30"
                                                                        )}
                                                                    >
                                                                        {config.is_active ? 'Activo' : 'Inactivo'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}


                        <Card className="bg-[#0E1219] border-[#1F2937] shadow-xl shadow-black/20 rounded-2xl">
                            <CardHeader className="cursor-pointer" onClick={() => setIsAgentConfigExpanded(!isAgentConfigExpanded)}>
                                <CardTitle className="flex items-center justify-between text-[#E8ECF1]">
                                    <div className="flex items-center gap-3">
                                        <Bot size={18} className="text-[rgba(255,255,255,0.55)]" />
                                        Configuración Agente IA
                                        <button
                                            type="button"
                                            className="ml-2 p-1.5 hover:bg-[#141A23] rounded-lg transition-all border border-[#1F2937] bg-[#0E1219] shadow-sm group"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toast.info('Funcionalidad de múltiples agentes próximamente. El wallet es compartido entre todos los agentes del cliente.');
                                            }}
                                            title="Añadir otro agente (próximamente)"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[rgba(255,255,255,0.3)] group-hover:text-[#E8ECF1]">
                                                <path d="M12 5v14M5 12h14"></path>
                                            </svg>
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        className="p-1 hover:bg-[#141A23] rounded-lg transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsAgentConfigExpanded(!isAgentConfigExpanded);
                                        }}
                                    >
                                        {isAgentConfigExpanded ? <ChevronUp size={20} className="text-[rgba(255,255,255,0.3)]" /> : <ChevronDown size={20} className="text-[rgba(255,255,255,0.3)]" />}
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
                                        <label className="text-sm font-medium text-[rgba(255,255,255,0.55)] flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#008DCB]"></div>
                                            Base de Conocimiento (Prompt/Info)
                                        </label>
                                        <textarea
                                            className="w-full h-32 bg-[#141A23] border border-[#1F2937] rounded-xl p-3 text-sm text-[#E8ECF1] focus:outline-none focus:border-[#008DCB] focus:ring-1 focus:ring-[#008DCB]/20 transition-all resize-none placeholder:text-[rgba(255,255,255,0.3)]"
                                            placeholder="Pegar aquí la información base del agente..."
                                            value={agent.knowledge_base}
                                            onChange={(e) => setAgent({ ...agent, knowledge_base: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Calendar Task */}
                                        <div className="space-y-3 p-4 rounded-xl bg-[#F78E5E]/5 border border-[#F78E5E]/20">
                                            <div className="flex items-center gap-2 text-[#F78E5E] font-medium pb-2 border-b border-[#F78E5E]/20">
                                                <Calendar size={16} />
                                                <span>Agenda / Citas</span>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-[rgba(255,255,255,0.55)]">Proveedor</label>
                                                <select
                                                    className="w-full bg-[#0E1219] border border-[#1F2937] rounded-lg p-2 text-sm text-[#E8ECF1] focus:outline-none focus:border-[#F78E5E]"
                                                    value={agent.agenda_config.type}
                                                    onChange={(e) => setAgent({ ...agent, agenda_config: { ...agent.agenda_config, type: e.target.value } })}
                                                >
                                                    <option value="google">Google Calendar</option>
                                                    <option value="calcom">Cal.com</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-[rgba(255,255,255,0.55)]">URL / Link Agendamiento</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-[#0E1219] border border-[#1F2937] rounded-lg p-2 text-sm text-[#E8ECF1] focus:outline-none focus:border-[#F78E5E] placeholder:text-[rgba(255,255,255,0.3)]"
                                                    value={agent.agenda_config.url}
                                                    onChange={(e) => setAgent({ ...agent, agenda_config: { ...agent.agenda_config, url: e.target.value } })}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </div>

                                        {/* Transfer Task */}
                                        <div className="space-y-3 p-4 rounded-xl bg-[#22C55E]/5 border border-[#22C55E]/20">
                                            <div className="flex items-center justify-between text-[#22C55E] font-medium pb-2 border-b border-[#22C55E]/20">
                                                <div className="flex items-center gap-2">
                                                    <Share2 size={16} />
                                                    <span>Transferencias</span>
                                                </div>
                                                <button
                                                    onClick={() => setAgent({ ...agent, transfer_config: [...agent.transfer_config, { number: '', who: '' }] })}
                                                    className="text-xs bg-[#22C55E]/10 hover:bg-[#22C55E]/20 px-2 py-1 rounded-md transition-colors text-[#22C55E]"
                                                >
                                                    + Añadir
                                                </button>
                                            </div>

                                            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                                                {agent.transfer_config.map((t, i) => (
                                                    <div key={i} className="space-y-2 pb-3 border-b border-[#22C55E]/20 last:border-0 relative group/row">
                                                        {agent.transfer_config.length > 1 && (
                                                            <button
                                                                onClick={() => setAgent({ ...agent, transfer_config: agent.transfer_config.filter((_, idx) => idx !== i) })}
                                                                type="button"
                                                                className="absolute -right-1 -top-1 p-1 text-[rgba(255,255,255,0.3)] hover:text-[#F78E5E] transition-colors"
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
                                                            bgWhite={false}
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
                                                            bgWhite={false}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Notifications Task */}
                                        <div className="col-span-1 md:col-span-2 space-y-3 p-4 rounded-xl bg-gradient-to-r from-[#0E1219] to-[#008DCB]/10 border border-[#1F2937]">
                                            <div className="flex items-center gap-2 text-[#008DCB] font-medium pb-2 border-b border-[#008DCB]/20">
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
                                                    bgWhite={false}
                                                />
                                                <FormInput
                                                    label="WhatsApp Avisos"
                                                    value={agent.notice_config.whatsapp}
                                                    onChange={v => setAgent({ ...agent, notice_config: { ...agent.notice_config, whatsapp: v } })}
                                                    placeholder="+34 600..."
                                                    compact
                                                    bgWhite={false}
                                                />
                                            </div>
                                        </div>

                                        {/* Technical Config - Inside Agent Config */}
                                        <div className="col-span-1 md:col-span-2 space-y-3 p-4 rounded-xl bg-[#0E1219] border border-[#1F2937] mt-6 relative overflow-hidden">
                                            {/* Decorative gradient background */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 pointer-events-none" />

                                            <div className="relative flex items-center gap-2 text-[#E8ECF1] font-medium pb-2 border-b border-[#1F2937]">
                                                <Key size={16} className="text-[rgba(255,255,255,0.55)]" />
                                                <span>Configuración Técnica</span>
                                            </div>
                                            <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <FormInput
                                                    label="Workspace Name"
                                                    value={client.workspace_name}
                                                    onChange={v => setClient({ ...client, workspace_name: v })}
                                                    compact
                                                    bgWhite={false}
                                                />
                                                <FormInput
                                                    label="Agent ID"
                                                    value={client.agent_id}
                                                    onChange={v => setClient({ ...client, agent_id: v })}
                                                    fontMono
                                                    compact
                                                    bgWhite={false}
                                                />
                                            </div>
                                            <div className="relative">
                                                <FormInput
                                                    label="Retell API Key"
                                                    value={client.api_key_retail}
                                                    onChange={v => setClient({ ...client, api_key_retail: v })}
                                                    type="password"
                                                    fontMono
                                                    compact
                                                    bgWhite={false}
                                                />
                                            </div>

                                            {/* Webhook Section */}
                                            <div className="relative space-y-2 pt-4 border-t border-[#1F2937] mt-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Share2 size={14} className="text-[#008DCB]" />
                                                    <label className="text-xs font-bold text-[#E8ECF1] uppercase tracking-wider">Agent Level Webhook</label>
                                                </div>
                                                <p className="text-[10px] text-[rgba(255,255,255,0.55)] leading-relaxed mb-3">
                                                    Copia esta URL en la sección <span className="font-bold text-[#E8ECF1]">"Agent Level Webhook"</span> de tu agente en Retell para capturar estadísticas y enviar info al panel.
                                                </p>

                                                {client.webhook_token ? (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2 bg-[#141A23] border border-[#1F2937] rounded-xl p-2 pr-1">
                                                            <code className="flex-1 px-2 text-[10px] font-mono text-[#E8ECF1] break-all leading-relaxed">
                                                                {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/retell?token=${client.webhook_token}` : 'URL se generará al guardar'}
                                                            </code>
                                                            <button
                                                                onClick={() => {
                                                                    const url = `${window.location.origin}/api/webhooks/retell?token=${client.webhook_token}`;
                                                                    navigator.clipboard.writeText(url);
                                                                    toast.success('Webhook URL copiada');
                                                                }}
                                                                className="p-2.5 bg-[#0E1219] border border-[#1F2937] hover:border-[#008DCB] hover:text-[#008DCB] rounded-lg text-[rgba(255,255,255,0.4)] transition-all shadow-sm"
                                                                title="Copiar URL"
                                                            >
                                                                <ExternalLink size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-[#F78E5E] bg-[#F78E5E]/10 p-3 rounded-xl border border-[#F78E5E]/20 font-medium italic">
                                                        Pulsa "Guardar Cambios" para generar la URL del Webhook automáticamente.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* Stats / Invoices Placeholder */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-[#0E1219] border-[#1F2937] shadow-xl shadow-black/20 rounded-2xl">
                                <CardHeader><CardTitle className="text-base text-[#E8ECF1]">Facturación</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="h-32 flex items-center justify-center text-[rgba(255,255,255,0.3)] border border-dashed border-[#1F2937] rounded-lg bg-[#141A23]">
                                        Gráfico de Facturación (Próximamente)
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#0E1219] border-[#1F2937] shadow-xl shadow-black/20 rounded-2xl">
                                <CardHeader><CardTitle className="text-base text-[#E8ECF1]">Estadísticas de Llamadas</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="h-32 flex items-center justify-center text-[rgba(255,255,255,0.3)] border border-dashed border-[#1F2937] rounded-lg bg-[#141A23]">
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
            <label className="text-xs font-medium text-[rgba(255,255,255,0.55)]">{label}</label>
            <div className="relative">
                {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)]">{icon}</div>}
                <input
                    type={type}
                    className={`w-full border border-[#1F2937] rounded-lg text-[#E8ECF1] focus:outline-none focus:border-[#008DCB] focus:ring-1 focus:ring-[#008DCB]/20 transition-all placeholder:text-[rgba(255,255,255,0.3)]
                        ${bgWhite ? 'bg-[#141A23]' : 'bg-[#0E1219]'}
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

// Updated FormSelect to support groups
interface SelectOptionGroup {
    label: string;
    options: string[];
}

function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: (string | SelectOptionGroup)[] }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-[rgba(255,255,255,0.55)]">{label}</label>
            <select
                className="w-full bg-[#141A23] border border-[#1F2937] rounded-lg py-2.5 px-3 text-[#E8ECF1] focus:outline-none focus:border-[#008DCB] focus:ring-1 focus:ring-[#008DCB]/20 transition-all"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map((option, idx) => {
                    if (typeof option === 'string') {
                        return <option key={option} value={option}>{option}</option>;
                    } else {
                        return (
                            <optgroup key={idx} label={option.label}>
                                {option.options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </optgroup>
                        );
                    }
                })}
            </select>
        </div>
    );
}
