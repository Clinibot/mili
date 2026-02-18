import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Resend } from 'resend';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'alertas@centrodemando.es';

export async function GET(req: NextRequest) {
    // This endpoint should be protected by an API key or a secret to prevent unauthorized execution
    const authHeader = req.headers.get('Authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = req.nextUrl.searchParams.get('type') || 'daily'; // 'daily' or 'weekly'

    try {
        // 1. Fetch clients with summary alerts enabled
        const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('id, name, slug, notification_preferences')
            .not('notification_preferences', 'is', null);

        if (clientsError) throw clientsError;

        const results = [];

        for (const client of clients) {
            const prefs = client.notification_preferences;
            const shouldProcess = type === 'daily' ? prefs.daily_summary : prefs.weekly_summary;
            const targetEmail = prefs.alert_email;

            if (!shouldProcess || !targetEmail) continue;

            // 2. Fetch calls for the period
            const daysToSubtract = type === 'daily' ? 1 : 7;
            const dateFrom = startOfDay(subDays(new Date(), daysToSubtract)).toISOString();
            const dateTo = endOfDay(subDays(new Date(), 1)).toISOString();

            const { data: calls, error: callsError } = await supabase
                .from('calls')
                .select('id, call_duration_seconds, call_status, recording_url, created_at, call_analysis_data')
                .eq('client_id', client.id)
                .gte('created_at', dateFrom)
                .lte('created_at', dateTo);

            if (callsError) {
                console.error(`Error fetching calls for client ${client.slug}:`, callsError);
                continue;
            }

            if (calls.length === 0) continue; // Optional: Send "no activity" email? Usually better to skip.

            // 3. Generate Summary Stats
            const totalCalls = calls.length;
            const totalDuration = calls.reduce((acc, call) => acc + (call.call_duration_seconds || 0), 0);
            const completedCalls = calls.filter(c => c.call_status === 'completed').length;

            const statsHtml = `
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: #1e293b;">Resumen de Actividad (${type === 'daily' ? 'Diario' : 'Semanal'})</h3>
                    <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 10px;">
                        <p><strong>Total Llamadas:</strong> ${totalCalls}</p>
                        <p><strong>Completadas:</strong> ${completedCalls}</p>
                        <p><strong>Duración Total:</strong> ${Math.round(totalDuration / 60)} min</p>
                        <p><strong>Media por Llamada:</strong> ${totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0} seg</p>
                    </div>
                </div>
            `;

            // 4. Send Email via Resend
            const subject = `${type === 'daily' ? 'Resumen Diario' : 'Resumen Semanal'} de Llamadas - ${client.name}`;
            const headerTitle = type === 'daily' ? 'Tu resumen diario de llamadas' : 'Tu resumen semanal de actividad';

            await resend.emails.send({
                from: FROM_EMAIL,
                to: [targetEmail],
                subject: subject,
                html: `
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
                        <div style="padding: 20px 0; text-align: center;">
                            <h1 style="color: #008DCB; margin-bottom: 5px;">Mili IA</h1>
                            <p style="text-transform: uppercase; letter-spacing: 1px; font-size: 12px; color: #64748b; font-weight: bold;">${headerTitle}</p>
                        </div>
                        
                        <div style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; background-color: #ffffff;">
                            <p>Hola,</p>
                            <p>Aquí tienes el resumen de actividad de tu agente IA para <strong>${client.name}</strong> correspondiente al periodo del ${format(new Date(dateFrom), "d 'de' MMMM", { locale: es })} al ${format(new Date(dateTo), "d 'de' MMMM", { locale: es })}.</p>
                            
                            ${statsHtml}
                            
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/${client.slug}" style="background-color: #008DCB; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">Ver todas las llamadas</a>
                            </div>
                        </div>
                        
                        <div style="padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
                            <p>Has recibido este email porque tienes activadas las alertas en tu panel de cliente.</p>
                            <p>&copy; ${new Date().getFullYear()} Mili IA - centrodemando.es</p>
                        </div>
                    </div>
                `
            });

            results.push({ client: client.slug, status: 'sent' });
        }

        return NextResponse.json({ success: true, processed: results.length, details: results });
    } catch (error: any) {
        console.error('Error processing alerts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
