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
    }, [clientId]);

    const handleRecharge = async () => {
        const amount = parseFloat(rechargeAmount);
        if (amount < 10) {
            toast.error('El importe minimo de recarga es 10€');
            return;
        }

        toast.info('Redirigiendo a Stripe...');
        // TODO: Call Stripe checkout API
        // For now, placeholder
    };

    const handleSubscription = async () => {
        if (wallet.subscriptionTier !== 'none') {
            toast.info('Ya tienes una subscripcion activa');
            return;
        }

        toast.info('Configurando subscripcion...');
        // TODO: Create Stripe subscription
    };

    if (loading) {
        return (
            <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-800">Monedero</CardTitle>
                </CardHeader>
                <CardContent className="animate-pulse">
                    <div className="h-32 bg-slate-100 rounded"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800">Monedero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Balance Display */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
                    <p className="text-sm font-medium opacity-90 mb-2">Saldo Disponible</p>
                    <p className="text-4xl font-bold">{wallet.balance.toFixed(2)}€</p>
                    {wallet.subscriptionTier !== 'none' && (
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <p className="text-xs opacity-75">Subscripcion Activa</p>
                            <p className="text-lg font-semibold">{wallet.subscriptionAmount}€/mes</p>
                        </div>
                    )}
                </div>

                {/* Recharge Section */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700">Recargar Saldo</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min="10"
                            step="5"
                            value={rechargeAmount}
                            onChange={(e) => setRechargeAmount(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Cantidad (min. 10€)"
                        />
                        <button
                            onClick={handleRecharge}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            Recargar
                        </button>
                    </div>
                </div>

                {/* Subscription Section */}
                {wallet.subscriptionTier === 'none' && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <p className="text-sm font-semibold text-slate-800 mb-2">Subscripcion Mensual</p>
                        <p className="text-xs text-slate-600 mb-4">
                            Subscripcion minima: 95€ base + consumo. Recarga automatica mensual.
                        </p>
                        <button
                            onClick={handleSubscription}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        >
                            Configurar Subscripcion (min. 100€)
                        </button>
                    </div>
                )}

                {wallet.subscriptionTier !== 'none' && (
                    <div className="text-center">
                        <button
                            onClick={() => toast.info('Gestion de subscripcion proximamente')}
                            className="text-sm text-slate-500 hover:text-slate-700 underline"
                        >
                            Gestionar Subscripcion
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
