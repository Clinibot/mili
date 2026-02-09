import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize with dummy key if not in production to allow build to succeed
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');

export async function POST(request: NextRequest) {
    try {
        const { to, subject, message } = await request.json();

        if (!to || !subject || !message) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos: to, subject, message' },
                { status: 400 }
            );
        }

        // Check if API key is configured at runtime
        if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_dummy_key_for_build') {
            console.warn('[EMAIL] RESEND_API_KEY not configured - email will not be sent');
            return NextResponse.json(
                { error: 'Email service not configured' },
                { status: 503 }
            );
        }

        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
            to: [to],
            subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">${subject}</h2>
                    <p style="color: #666; line-height: 1.6;">${message}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">
                        Este es un email automático de IA para Llamadas.
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('[API] Error enviando email:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, id: data?.id });
    } catch (error: any) {
        console.error('[API] Error inesperado:', error);
        return NextResponse.json(
            { error: error.message || 'Error desconocido' },
            { status: 500 }
        );
    }
}
