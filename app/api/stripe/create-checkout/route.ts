import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY no está configurada');
        }

        const { amount, clientId, type = 'recharge', packName } = await request.json();
        const baseUrl = process.env.NEXT_PUBLIC_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        const isSubscription = type === 'subscription';

        if (!amount || amount < 10) {
            return NextResponse.json(
                { error: 'El importe mínimo es 10€' },
                { status: 400 }
            );
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: isSubscription ? `Mantenimiento + ${packName || ''}` : 'Recarga de Saldo',
                            description: isSubscription
                                ? `Suscripción mensual: Mantenimiento + ${packName || 'Plan seleccionado'}`
                                : `Recarga de €${amount} para tu agente de IA`
                        },
                        unit_amount: Math.round(amount * 100), // Stripe usa centavos
                        ...(isSubscription && {
                            recurring: {
                                interval: 'month'
                            }
                        })
                    },
                    quantity: 1
                }
            ],
            mode: isSubscription ? 'subscription' : 'payment',
            success_url: `${baseUrl}/portal/${clientId}?payment=success`,
            cancel_url: `${baseUrl}/portal/${clientId}?payment=cancel`,
            metadata: {
                clientId,
                amount: amount.toString(),
                type: type,
                packName: packName || 'none'
            }
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error('❌ Detailed Stripe Error:', {
            message: error.message,
            stack: error.stack,
            type: error.type,
            raw: error.raw
        });

        return NextResponse.json(
            {
                error: 'Error al crear la sesión de pago',
                details: error.message,
                missingKeys: {
                    stripeKey: !process.env.STRIPE_SECRET_KEY,
                    publicUrl: !process.env.NEXT_PUBLIC_URL
                }
            },
            { status: 500 }
        );
    }
}
