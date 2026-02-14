"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WalletData {
    balance: number;
    subscriptionTier: string;
    subscriptionAmount: number;
    lastBillingDate: string | null;
}

export default function WalletSection({ clientId }: { clientId: string }) {
    const [wallet, setWallet] = useState<WalletData>({
        balance: 0,
        subscriptionTier: 'none',
        subscriptionAmount: 0,
        lastBillingDate: null
    });
    const [loading, setLoading] = useState(true);
    const [rechargeAmount, setRechargeAmount] = useState('100');
    const [selectedPack, setSelectedPack] = useState<'none' | '100min' | '300min' | 'custom'>('none');
    const [customAmount, setCustomAmount] = useState('120');

    const SUBSCRIPTION_PACKS = {
        none: { name: 'Solo Mantenimiento', price: 55, extraMinutes: 0 },
        '100min': { name: 'Pack 100 min', price: 71, extraMinutes: 100, costExtra: 16 },
        '300min': { name: 'Pack 300 min', price: 103, extraMinutes: 300, costExtra: 48 }
    };

    useEffect(() => {
        async function fetchWallet() {
            const { data } = await supabase
                .from('clients')
                .select('balance, subscription_tier, subscription_amount, last_maintenance_billing')
                .eq('id', clientId)
                .single();

            if (data) {
                setWallet({
                    balance: data.balance || 0,
                    subscriptionTier: data.subscription_tier || 'none',
                    subscriptionAmount: data.subscription_amount || 0,
                    lastBillingDate: data.last_maintenance_billing || null
                });
            }
            setLoading(false);
        }

        fetchWallet();

        // Check for payment success
        const params = new URLSearchParams(window.location.search);
        if (params.get('payment') === 'success') {
            toast.success('¡Recarga exitosa! Tu saldo se ha actualizado.');
            // Limpiar URL
            window.history.replaceState({}, '', window.location.pathname);
            // Refrescar balance
            fetchWallet();
        } else if (params.get('payment') === 'cancel') {
            toast.info('Recarga cancelada');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [clientId]);

    const handleRecharge = async () => {
        const amount = parseFloat(rechargeAmount);
        if (amount < 10) {
            toast.error('El importe mínimo de recarga es 10€');
            return;
        }

        try {
            toast.info('Redirigiendo a Stripe...');

            const response = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    clientId
                })
            });

            const data = await response.json();

            if (data.url) {
                // Redirigir a Stripe Checkout
                window.location.href = data.url;
            } else {
                toast.error(data.error || 'Error al procesar la recarga');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al procesar la recarga');
        }
    };

    const handleSubscription = async () => {
        if (wallet.subscriptionTier !== 'none' && wallet.subscriptionTier !== null) {
            toast.info('Ya tienes una suscripción activa');
            return;
        }

        try {
            toast.info('Redirigiendo a suscripciones...');

            let price = 0;
            let packName = '';

            if (selectedPack === 'custom') {
                price = parseFloat(customAmount);
                if (price < 55) {
                    toast.error('La suscripción mínima es de 55€ (Mantenimiento)');
                    return;
                }
                packName = 'Suscripción Personalizada';
            } else {
                price = SUBSCRIPTION_PACKS[selectedPack].price;
                packName = SUBSCRIPTION_PACKS[selectedPack].name;
            }

            const response = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: price,
                    clientId,
                    type: 'subscription',
                    packName: packName
                })
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error(data.error || 'Error al configurar la suscripción');
            }
        } catch (error) {
            console.error('Error subscription:', error);
            toast.error('Error al conectar con el servidor');
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-48 bg-[#141A23] rounded-3xl"></div>
                <div className="h-24 bg-[#141A23] rounded-3xl"></div>
            </div>
        );
    }

    const nextBillingDate = wallet.lastBillingDate
        ? new Date(new Date(wallet.lastBillingDate).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
        : null;

    return (
        <div className="space-y-8">
            {/* Balance Display */}
            <Card className="border-none shadow-2xl shadow-blue-500/10 rounded-[40px] overflow-hidden bg-[#0E1219]">
                <CardContent className="p-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                            <p className="text-[#008DCB] font-sans text-xs uppercase tracking-[0.2em] mb-3 font-bold">Saldo Disponible</p>
                            <div className="text-7xl font-black font-header tracking-tighter text-[#E8ECF1]">
                                {wallet.balance.toFixed(2)}<span className="text-4xl ml-2 text-[rgba(255,255,255,0.55)] font-medium">€</span>
                            </div>
                        </div>
                        <div className="bg-[#070A0F] rounded-3xl p-6 border border-[#1F2937] w-full md:w-auto min-w-[200px]">
                            <p className="text-[10px] font-bold text-[rgba(255,255,255,0.3)] uppercase tracking-wider mb-2">Estado Cuenta</p>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-[#67B7AF] animate-pulse"></div>
                                <span className="text-sm font-bold text-[#E8ECF1] uppercase">{wallet.subscriptionTier !== 'none' ? 'Suscripción Activa' : 'ACTIVA'}</span>
                            </div>
                            {nextBillingDate && wallet.subscriptionTier !== 'none' && (
                                <p className="text-[10px] font-bold text-[#008DCB] uppercase tracking-tight">
                                    Próximo cobro: {nextBillingDate}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recharge Section */}
            <Card className="border-[#1F2937] shadow-xl shadow-black/20 rounded-[32px] overflow-hidden bg-[#0E1219]">
                <CardHeader className="px-10 pt-10 pb-2">
                    <CardTitle className="text-xl font-bold text-[#E8ECF1]">Recargar Saldo</CardTitle>
                </CardHeader>
                <CardContent className="p-10 pt-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)] font-bold">€</span>
                            <input
                                type="number"
                                min="10"
                                step="5"
                                value={rechargeAmount}
                                onChange={(e) => setRechargeAmount(e.target.value)}
                                className="w-full bg-[#070A0F] border border-[#1F2937] rounded-2xl pl-10 pr-5 py-4 text-xl font-bold text-[#E8ECF1] focus:outline-none focus:border-[#008DCB] focus:ring-4 focus:ring-[#008DCB]/10 transition-all placeholder:text-[rgba(255,255,255,0.3)]"
                                placeholder="0.00"
                            />
                        </div>
                        <button
                            onClick={handleRecharge}
                            className="bg-[#008DCB] hover:bg-[#008DCB]/90 text-[#070A0F] px-10 py-4 rounded-2xl font-black text-lg transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                        >
                            Recargar Ahora
                        </button>
                    </div>
                    <p className="text-xs text-[rgba(255,255,255,0.3)] mt-4 text-center sm:text-left font-medium">
                        Importe mínimo de recarga: 10€. Los fondos se aplican instantáneamente a tu cuenta.
                    </p>
                </CardContent>
            </Card>

            {/* Subscription Section */}
            <Card className="border-[#1F2937] shadow-xl shadow-black/20 rounded-[32px] overflow-hidden bg-[#0E1219]">
                <CardContent className="p-10">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-[#141A23] text-[#E8ECF1] p-2 rounded-xl border border-[#1F2937]">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                                </div>
                                <CardTitle className="text-xl font-bold text-[#E8ECF1]">Suscripción Mensual</CardTitle>
                            </div>
                            <p className="text-[rgba(255,255,255,0.55)] leading-relaxed font-medium mb-6">
                                Activa la recarga automática y una cuota fija de mantenimiento para asegurar que tu agente nunca deje de atender llamadas.
                            </p>

                            {/* Packs de Minutos */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {(Object.entries(SUBSCRIPTION_PACKS) as [keyof typeof SUBSCRIPTION_PACKS, any][]).map(([id, pack]) => (
                                    <button
                                        key={id}
                                        onClick={() => setSelectedPack(id as any)}
                                        className={cn(
                                            "flex flex-col items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 text-center h-full",
                                            selectedPack === id
                                                ? "border-[#008DCB] bg-[#141A23]"
                                                : "border-[#1F2937] hover:border-[rgba(255,255,255,0.3)] bg-[#070A0F]"
                                        )}
                                    >
                                        <div className={cn(
                                            "text-[10px] font-black uppercase tracking-widest mb-1",
                                            selectedPack === id ? "text-[#008DCB]" : "text-[rgba(255,255,255,0.3)]"
                                        )}>
                                            {id === 'none' ? 'Básico' : pack.name}
                                        </div>
                                        <div className="text-lg font-black text-[#E8ECF1] leading-tight">
                                            {pack.price}€<span className="text-[10px] font-bold text-[rgba(255,255,255,0.3)] ml-0.5">/mes</span>
                                        </div>
                                        {id === 'none' ? (
                                            <div className="mt-1 text-[9px] font-bold text-[rgba(255,255,255,0.3)] bg-[#141A23] px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                0 min (Recarga manual)
                                            </div>
                                        ) : (
                                            <div className="mt-1 text-[9px] font-bold text-[#67B7AF] bg-[rgba(103,183,175,0.1)] px-2 py-0.5 rounded-full">
                                                +{pack.extraMinutes} min incl.
                                            </div>
                                        )}
                                    </button>
                                ))}
                                {/* Opción Personalizada */}
                                <button
                                    onClick={() => setSelectedPack('custom')}
                                    className={cn(
                                        "flex flex-col items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 text-center relative h-full",
                                        selectedPack === 'custom'
                                            ? "border-[#008DCB] bg-[#141A23]"
                                            : "border-[#1F2937] hover:border-[rgba(255,255,255,0.3)] bg-[#070A0F]"
                                    )}
                                >
                                    <div className={cn(
                                        "text-[10px] font-black uppercase tracking-widest mb-1",
                                        selectedPack === 'custom' ? "text-[#008DCB]" : "text-[rgba(255,255,255,0.3)]"
                                    )}>
                                        Personalizado
                                    </div>
                                    <div className="text-lg font-black text-[#E8ECF1] leading-tight">
                                        A Medida
                                    </div>
                                    <div className="mt-1 text-[9px] font-bold text-[rgba(255,255,255,0.3)] bg-[#141A23] px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                        Tú eliges
                                    </div>
                                </button>
                            </div>

                            {/* Input para Personalizado */}
                            {selectedPack === 'custom' && (
                                <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 bg-[rgba(0,141,203,0.05)] p-4 rounded-2xl border border-[#008DCB]/20">
                                    <div className="flex-1 text-center sm:text-left">
                                        <p className="text-[#E8ECF1] font-bold text-sm">Define tu suscripción mensual</p>
                                        <p className="text-[xs] text-[rgba(255,255,255,0.5)]">Incluye mantenimiento (55€) + Saldo extra</p>
                                    </div>
                                    <div className="relative w-full sm:w-auto">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E8ECF1] font-bold">€</span>
                                        <input
                                            type="number"
                                            min="55"
                                            step="5"
                                            value={customAmount}
                                            onChange={(e) => setCustomAmount(e.target.value)}
                                            className="w-full sm:w-32 bg-[#070A0F] border border-[#1F2937] rounded-xl pl-8 pr-4 py-3 text-[#E8ECF1] font-bold focus:outline-none focus:border-[#008DCB] transition-colors"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="w-full md:w-auto">
                            {wallet.subscriptionTier === 'none' || !wallet.subscriptionTier ? (
                                <button
                                    onClick={handleSubscription}
                                    className="w-full md:w-auto px-10 py-5 bg-[#E8ECF1] hover:bg-[#E8ECF1]/90 text-[#070A0F] rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 flex flex-col items-center"
                                >
                                    <span>ACTIVAR SUSCRIPCIÓN</span>
                                    <span className="text-xs text-[#070A0F]/60 font-bold mt-1">
                                        POR {selectedPack === 'custom' ? `${parseFloat(customAmount || '0').toFixed(2)}` : SUBSCRIPTION_PACKS[selectedPack as keyof typeof SUBSCRIPTION_PACKS].price}€/MES
                                    </span>
                                </button>
                            ) : (
                                <button className="w-full md:w-auto px-8 py-5 bg-[rgba(103,183,175,0.1)] text-[#67B7AF] border border-[#67B7AF]/20 rounded-2xl font-black text-sm cursor-default">
                                    SUSCRIPCIÓN ACTIVA
                                </button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
