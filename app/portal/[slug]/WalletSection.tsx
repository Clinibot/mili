"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface WalletData {
    balance: number;
    subscriptionTier: string;
    subscriptionAmount: number;
}

export default function WalletSection({ clientId }: { clientId: string }) {
    const [wallet, setWallet] = useState<WalletData>({
        balance: 0,
        subscriptionTier: 'none',
        subscriptionAmount: 0
    });
    const [loading, setLoading] = useState(true);
    const [rechargeAmount, setRechargeAmount] = useState('100');

    useEffect(() => {
        async function fetchWallet() {
            const { data } = await supabase
                .from('clients')
                .select('balance, subscription_tier, subscription_amount')
                .eq('id', clientId)
                .single();

            if (data) {
                setWallet({
                    balance: data.balance || 0,
                    subscriptionTier: data.subscription_tier || 'none',
                    subscriptionAmount: data.subscription_amount || 0
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

            const response = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: 55, // Precio fijo de la suscripci贸n solicitado en UI
                    clientId,
                    type: 'subscription'
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
                <div className="h-48 bg-slate-100 rounded-3xl"></div>
                <div className="h-24 bg-slate-100 rounded-3xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Balance Display */}
            <Card className="border-none shadow-2xl shadow-blue-500/10 rounded-[40px] overflow-hidden bg-white">
                <CardContent className="p-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                            <p className="text-blue-600 font-sans text-xs uppercase tracking-[0.2em] mb-3 font-bold">Saldo Disponible</p>
                            <div className="text-7xl font-black font-header tracking-tighter text-slate-900">
                                {wallet.balance.toFixed(2)}<span className="text-4xl ml-2 text-slate-400 font-medium">€</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 w-full md:w-auto min-w-[200px]">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Estado Cuenta</p>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-sm font-bold text-slate-700">ACTIVA</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recharge Section */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="px-10 pt-10 pb-2">
                    <CardTitle className="text-xl font-bold text-slate-800">Recargar Saldo</CardTitle>
                </CardHeader>
                <CardContent className="p-10 pt-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
                            <input
                                type="number"
                                min="10"
                                step="5"
                                value={rechargeAmount}
                                onChange={(e) => setRechargeAmount(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-5 py-4 text-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                placeholder="0.00"
                            />
                        </div>
                        <button
                            onClick={handleRecharge}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black text-lg transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                        >
                            Recargar Ahora
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-4 text-center sm:text-left font-medium">
                        Importe mínimo de recarga: 10€. Los fondos se aplican instantáneamente a tu cuenta.
                    </p>
                </CardContent>
            </Card>

            {/* Subscription Section */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white">
                <CardContent className="p-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-purple-100 text-purple-600 p-2 rounded-xl">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                                </div>
                                <CardTitle className="text-xl font-bold text-slate-800">Suscripción Mensual</CardTitle>
                            </div>
                            <p className="text-slate-500 leading-relaxed font-medium">
                                Activa la recarga automática y una cuota fija de mantenimiento para asegurar que tu agente nunca deje de atender llamadas.
                            </p>
                        </div>
                        <div className="w-full md:w-auto">
                            {wallet.subscriptionTier === 'none' ? (
                                <button
                                    onClick={handleSubscription}
                                    className="w-full md:w-auto px-8 py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95"
                                >
                                    ACTIVAR POR 55€/MES
                                </button>
                            ) : (
                                <button className="w-full md:w-auto px-8 py-5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-black text-sm cursor-default">
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
