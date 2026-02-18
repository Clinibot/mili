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
            const headerTitle = type === 'daily' ? 'Resumen Diario de Actividad' : 'Resumen Semanal de Actividad';

            await resend.emails.send({
                from: FROM_EMAIL,
                to: [targetEmail],
                subject: subject,
                html: `
                    <div style="background-color: #070A0F; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E8ECF1; margin: 0; width: 100% !important;">
                        <center>
                            <div style="max-width: 600px; text-align: left; background-color: #0E1219; border: 1px solid #1F2937; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
                                <!-- Header -->
                                <div style="padding: 40px; text-align: center; background: linear-gradient(180deg, rgba(0, 141, 203, 0.1) 0%, rgba(0, 0, 0, 0) 100%);">
                                    <div style="background-color: rgba(0, 141, 203, 0.1); width: 64px; height: 64px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; border: 1px solid rgba(0, 141, 203, 0.2);">
                                        <span style="font-size: 32px;">🤖</span>
                                    </div>
                                    <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; color: #FFFFFF;">Mili IA</h1>
                                    <p style="margin: 8px 0 0 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #008DCB;">${headerTitle}</p>
                                </div>

                                <!-- Body -->
                                <div style="padding: 0 40px 40px 40px;">
                                    <p style="font-size: 15px; line-height: 1.6; color: rgba(232, 236, 241, 0.7); margin-bottom: 30px;">
                                        Tu agente IA ha procesado la actividad de <strong>${client.name}</strong> para el periodo analizado. Aquí tienes los datos clave:
                                    </p>

                                    <!-- Stats Grid -->
                                    <div style="display: table; width: 100%; border-collapse: separate; border-spacing: 12px 0; margin: 0 -12px 30px -12px;">
                                        <div style="display: table-row;">
                                            <div style="display: table-cell; width: 50%; background-color: #141A23; border: 1px solid #1F2937; border-radius: 16px; padding: 20px;">
                                                <p style="margin: 0; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #4B5563;">TOTAL LLAMADAS</p>
                                                <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 900; color: #008DCB;">${totalCalls}</p>
                                            </div>
                                            <div style="display: table-cell; width: 50%; background-color: #141A23; border: 1px solid #1F2937; border-radius: 16px; padding: 20px;">
                                                <p style="margin: 0; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #4B5563;">MINUTOS TOTALES</p>
                                                <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 900; color: #008DCB;">${Math.round(totalDuration / 60)}'</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div style="background-color: #141A23; border: 1px solid #1F2937; border-radius: 16px; padding: 20px; margin-bottom: 40px;">
                                        <div style="display: flex; justify-content: justify; align-items: center; margin-bottom: 12px;">
                                            <p style="margin: 0; font-size: 12px; font-weight: 700; color: #E8ECF1;">Tasa de finalización</p>
                                            <p style="margin: 0; font-size: 12px; font-weight: 900; color: #22C55E; margin-left: auto;">${totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0}%</p>
                                        </div>
                                        <div style="background-color: #0E1219; height: 6px; border-radius: 3px; width: 100%;">
                                            <div style="background-color: #22C55E; height: 6px; border-radius: 3px; width: ${totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0}%;"></div>
                                        </div>
                                    </div>

                                    <!-- CTA -->
                                    <div style="text-align: center;">
                                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/${client.slug}" style="display: inline-block; background-color: #008DCB; color: #FFFFFF; font-size: 14px; font-weight: 900; text-decoration: none; padding: 18px 32px; border-radius: 16px; box-shadow: 0 8px 20px rgba(0, 141, 203, 0.3);">
                                            VER DETALLES EN EL PANEL
                                        </a>
                                    </div>
                                </div>

                                <!-- Footer -->
                                <div style="padding: 30px; border-top: 1px solid #1F2937; text-align: center; background-color: #0B0E14;">
                                    <p style="margin: 0; font-size: 11px; font-weight: 600; color: #4B5563; line-height: 1.5;">
                                        Este es un informe automático generado por Mili IA.<br>
                                        © ${new Date().getFullYear()} centrodemando.es
                                    </p>
                                </div>
                            </div>
                        </center>
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
