import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover'
});

export async function POST(request: NextRequest) {
    try {
        const { amount, clientId } = await request.json();

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
                            name: 'Recarga de Saldo',
                            description: `Recarga de €${amount} para tu agente de IA`
                        },
                        unit_amount: Math.round(amount * 100) // Stripe usa centavos
                    },
                    quantity: 1
                }
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_URL}/portal/${clientId}?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL}/portal/${clientId}?payment=cancel`,
            metadata: {
                clientId,
                amount: amount.toString(),
                type: 'recharge'
            }
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json(
            { error: 'Error creando sesión de pago' },
            { status: 500 }
        );
    }
}
