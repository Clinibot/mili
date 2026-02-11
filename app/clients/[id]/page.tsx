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

            toast.success('Guardado correctamente');

            if (id === 'new') {
                router.push(`/clients/${clientId}`);
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
                    {/* Left Column */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* Client Access - FIRST POSITION */}
                        <Card className="bg-gradient-to-br from-blue-50/30 via-slate-50 to-indigo-50/30 border-slate-200/50 shadow-sm rounded-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-700">
                                    <Lock size={18} className="text-slate-500" />
                                    Acceso Panel Cliente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-600">Usuario Portal</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/70 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
                                            placeholder="usuario.cliente"
                                            value={client.portal_user || ''}
                                            onChange={(e) => setClient({ ...client, portal_user: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-600">Contraseña Portal</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/70 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"
                                            placeholder="contraseña123"
                                            value={client.portal_password || ''}
                                            onChange={(e) => setClient({ ...client, portal_password: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="pt-2 flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-xs text-slate-500">Credenciales para que el cliente acceda a su panel.</p>
                                            <p className="text-[10px] text-slate-400">URL actual: /portal/{client.slug || id}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (saving) return;
                                                const currentSlug = client.slug || id;
                                                window.open(`/portal/${currentSlug}`, '_blank');
                                            }}
                                            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-slate-500/20"
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
                                    setClient({ ...client, name: v });
                                }} placeholder="Ej. Clínica Dental" />
                                <StatusSelector
                                    value={client.status || 'Cliente'}
                                    onChange={v => setClient({ ...client, status: v })}
                                />
                                <FormInput label="Slug / URL (Opcional)" value={client.slug} onChange={v => setClient({ ...client, slug: v })} placeholder="clinica-dental" fontMono />
                                <FormInput label="Nombre Contacto" value={client.contact_name} onChange={v => setClient({ ...client, contact_name: v })} placeholder="Ej. Juan Pérez" />
                                <FormInput label="Email Contacto" value={client.contact_email} onChange={v => setClient({ ...client, contact_email: v })} type="email" />
                                <FormInput label="Teléfono Contacto" value={client.contact_phone} onChange={v => setClient({ ...client, contact_phone: v })} />
                                <FormInput label="Teléfono IA Asignado" value={client.phone_ia} onChange={v => setClient({ ...client, phone_ia: v })} icon={<Phone size={14} />} />
                                <FormInput label="Coste por Minuto (€)" value={client.cost_per_minute} onChange={v => setClient({ ...client, cost_per_minute: Number(v) })} type="number" />

                                {/* Multiple Contacts Section */}
                                <div className="col-span-full pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Contactos Adicionales</h3>
                                        <button
                                            type="button"
                                            onClick={addContactRow}
                                            className="text-xs flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                        >
                                            <Plus size={14} />
                                            Añadir
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {extraContacts.map((contact, index) => (
                                            <div key={contact.id || index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start animate-in slide-in-from-top-1 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                                <div className="md:col-span-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Nombre"
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
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
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
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
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
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
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
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
                                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Eliminar contacto"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {extraContacts.length === 0 && (
                                            <p className="text-xs text-slate-400 italic text-center py-2 border border-dashed border-slate-200 rounded-lg">No hay contactos adicionales</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-2 border-t border-slate-100 mt-2">
                                    <label className="text-xs font-medium text-slate-500">Notas / Información Recopilada</label>
                                    <textarea
                                        className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-y placeholder:text-slate-400"
                                        placeholder="Escribe aquí toda la información recopilada del cliente, resumen de llamadas, detalles a tener en cuenta..."
                                        value={client.notes || ''}
                                        onChange={(e) => setClient({ ...client, notes: e.target.value })}
                                    />
                                    <p className="text-[10px] text-slate-400">Esta información es privada para los administradores.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Gift Balance - Admin Only */}
                        <Card className="bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-slate-50 border-slate-200/50 shadow-sm rounded-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-700">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                                        <rect x="3" y="8" width="18" height="4" rx="1"></rect>
                                        <path d="M12 8v13"></path>
                                        <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path>
                                        <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path>
                                    </svg>
                                    Regalar Saldo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-xs text-emerald-700">Añade saldo gratis al monedero del cliente como regalo o crédito promocional.</p>
                                <div className="flex gap-3">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">€</span>
                                        <input
                                            type="number"
                                            min="1"
                                            step="5"
                                            placeholder="0.00"
                                            className="w-full bg-white/70 border border-emerald-200 rounded-lg pl-8 pr-3 py-2.5 text-emerald-900 font-bold placeholder:text-emerald-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
                                        className="px-6 py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-bold rounded-lg transition-all shadow-md shadow-slate-500/20 flex items-center gap-2 whitespace-nowrap"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 5v14M5 12h14"></path>
                                        </svg>
                                        Regalar
                                    </button>
                                </div>
                                <div className="text-xs text-slate-600 bg-white/50 px-3 py-2 rounded-lg border border-slate-200">
                                    <strong>Balance actual:</strong> €{(client.balance || 0).toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Budget Template + AI Agent Config + Technical Config */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Budget Template Card */}
                        <Card className="bg-white border-slate-100 shadow-sm rounded-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-700">
                                    <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
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
                                <p className="text-sm text-slate-500">Sube aquí el presupuesto o plantilla PDF/Doc para este cliente.</p>

                                {client.budget_template_url ? (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm text-red-500">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-700 truncate">Presupuesto_Cliente.pdf</p>
                                            <a
                                                href={client.budget_template_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1 mt-0.5"
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
                                            className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                            title="Eliminar"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 group-hover:border-blue-300 group-hover:bg-blue-50/10 transition-all cursor-pointer">
                                            <div className="p-3 bg-slate-50 rounded-full group-hover:bg-blue-100/50 transition-colors">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-blue-500">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                    <polyline points="17 8 12 3 7 8"></polyline>
                                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                                </svg>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-slate-600 group-hover:text-blue-600">Subir presupuesto</p>
                                                <p className="text-xs text-slate-400">PDF, DOCX, IMG (Max 5MB)</p>
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

                        <Card className="bg-gradient-to-br from-indigo-50/40 via-blue-50/30 to-slate-50 border-slate-200/50 shadow-sm rounded-2xl">
                            <CardHeader className="cursor-pointer" onClick={() => setIsAgentConfigExpanded(!isAgentConfigExpanded)}>
                                <CardTitle className="flex items-center justify-between text-slate-700">
                                    <div className="flex items-center gap-3">
                                        <Bot size={18} className="text-slate-500" />
                                        Configuración Agente IA
                                        <button
                                            type="button"
                                            className="ml-2 p-1.5 hover:bg-white/80 rounded-lg transition-all border border-slate-300 bg-white shadow-sm group"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toast.info('Funcionalidad de múltiples agentes próximamente. El wallet es compartido entre todos los agentes del cliente.');
                                            }}
                                            title="Añadir otro agente (próximamente)"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-slate-600">
                                                <path d="M12 5v14M5 12h14"></path>
                                            </svg>
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        className="p-1 hover:bg-white/50 rounded-lg transition-colors"
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
                                        <div className="col-span-1 md:col-span-2 space-y-3 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-200/50">
                                            <div className="flex items-center gap-2 text-slate-600 font-medium pb-2 border-b border-slate-200/50">
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

                                        {/* Technical Config - Inside Agent Config */}
                                        <div className="col-span-1 md:col-span-2 space-y-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50/30 to-slate-50 border border-slate-200/50 mt-6">
                                            <div className="flex items-center gap-2 text-slate-600 font-medium pb-2 border-b border-slate-200/50">
                                                <Key size={16} />
                                                <span>Configuración Técnica</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <FormInput
                                                    label="Workspace Name"
                                                    value={client.workspace_name}
                                                    onChange={v => setClient({ ...client, workspace_name: v })}
                                                    compact
                                                    bgWhite
                                                />
                                                <FormInput
                                                    label="Agent ID"
                                                    value={client.agent_id}
                                                    onChange={v => setClient({ ...client, agent_id: v })}
                                                    fontMono
                                                    compact
                                                    bgWhite
                                                />
                                            </div>
                                            <FormInput
                                                label="Retell API Key"
                                                value={client.api_key_retail}
                                                onChange={v => setClient({ ...client, api_key_retail: v })}
                                                type="password"
                                                fontMono
                                                compact
                                                bgWhite
                                            />

                                            {/* Webhook Section */}
                                            <div className="space-y-2 pt-4 border-t border-purple-100 mt-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Share2 size={14} className="text-blue-500" />
                                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Agent Level Webhook</label>
                                                </div>
                                                <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                                                    Copia esta URL en la sección <span className="font-bold text-slate-700">"Agent Level Webhook"</span> de tu agente en Retell para capturar estadísticas y enviar info al panel.
                                                </p>

                                                {client.webhook_token ? (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2 bg-white border border-purple-200 rounded-xl p-2 pr-1">
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

// Updated FormSelect to support groups
interface SelectOptionGroup {
    label: string;
    options: string[];
}

function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: (string | SelectOptionGroup)[] }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">{label}</label>
            <select
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
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
