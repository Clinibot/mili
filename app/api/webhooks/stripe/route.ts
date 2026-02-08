import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover'
});

// Server-side Supabase client with service role
// Use placeholders during build if env vars not available
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error('⚠️ Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('✅ Webhook received:', event.type);

    // Manejar evento de pago exitoso
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const { clientId, amount, type } = session.metadata || {};

        if (!clientId || !amount) {
            console.error('Missing metadata in session');
            return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
        }

        try {
            const rechargeAmount = parseFloat(amount);
            const isSubscription = type === 'subscription';

            if (isSubscription) {
                // 1. Actualizar estado de suscripción del cliente
                const { error: updateError } = await supabase
                    .from('clients')
                    .update({
                        subscription_tier: 'monthly',
                        subscription_amount: rechargeAmount,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', clientId);

                if (updateError) {
                    console.error('Error updating subscription:', updateError);
                    throw updateError;
                }

                // 2. Registrar transacción de suscripción
                await supabase
                    .from('transactions')
                    .insert({
                        client_id: clientId,
                        amount: rechargeAmount,
                        type: 'subscription',
                        status: 'completed',
                        stripe_session_id: session.id,
                        description: `Alta de suscripción mensual: €${rechargeAmount}`,
                        created_at: new Date().toISOString()
                    });

                console.log(`✅ Subscription activated for client ${clientId}: €${rechargeAmount}/mes`);
            } else {
                // 1. Obtener balance actual
                const { data: client, error: fetchError } = await supabase
                    .from('clients')
                    .select('balance')
                    .eq('id', clientId)
                    .single();

                if (fetchError) {
                    console.error('Error fetching client:', fetchError);
                    throw fetchError;
                }

                const currentBalance = client?.balance || 0;
                const newBalance = currentBalance + rechargeAmount;

                // 2. Actualizar balance
                const { error: updateError } = await supabase
                    .from('clients')
                    .update({ balance: newBalance })
                    .eq('id', clientId);

                if (updateError) {
                    console.error('Error updating balance:', updateError);
                    throw updateError;
                }

                // 3. Registrar transacción de recarga
                const { error: transactionError } = await supabase
                    .from('transactions')
                    .insert({
                        client_id: clientId,
                        amount: rechargeAmount,
                        type: 'recharge',
                        status: 'completed',
                        stripe_session_id: session.id,
                        description: `Recarga vía Stripe: €${rechargeAmount}`,
                        created_at: new Date().toISOString()
                    });

                if (transactionError) {
                    console.error('Error creating transaction:', transactionError);
                }

                console.log(`✅ Balance updated for client ${clientId}: €${currentBalance} → €${newBalance}`);
            }
        } catch (error: any) {
            console.error('❌ Error processing webhook:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
