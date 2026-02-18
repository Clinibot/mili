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

    const type = req.nextUrl.searchParams.get('type') || 'daily'; // 'daily', 'weekly', 'monthly'

    try {
        // 1. Fetch clients with summary alerts enabled
        const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('id, name, slug, balance, notification_preferences')
            .not('notification_preferences', 'is', null);

        if (clientsError) throw clientsError;

        const results = [];

        for (const client of clients) {
            const prefs = client.notification_preferences;
            let shouldProcess = false;
            if (type === 'daily') shouldProcess = prefs.daily_summary;
            if (type === 'weekly') shouldProcess = prefs.weekly_summary;
            if (type === 'monthly') shouldProcess = prefs.monthly_summary;

            const targetEmail = prefs.alert_email;

            if (!shouldProcess || !targetEmail) continue;

            // 2. Fetch calls for the period
            let daysToSubtract = 1;
            if (type === 'weekly') daysToSubtract = 7;
            if (type === 'monthly') daysToSubtract = 30;

            const dateFrom = startOfDay(subDays(new Date(), daysToSubtract)).toISOString();
            const dateTo = endOfDay(new Date()).toISOString();

            const { data: calls, error: callsError } = await supabase
                .from('calls')
                .select('id, call_duration_seconds, call_status, created_at, phone_number, product_name')
                .eq('client_id', client.id)
                .gte('created_at', dateFrom)
                .lte('created_at', dateTo)
                .order('created_at', { ascending: false });

            if (callsError) {
                console.error(`Error fetching calls for client ${client.slug}:`, callsError);
                continue;
            }

            // 3. Generate Summary Stats
            const totalCalls = calls?.length || 0;
            const totalDuration = calls?.reduce((acc, call) => acc + (call.call_duration_seconds || 0), 0) || 0;
            const completedCalls = calls?.filter(c => c.call_status === 'completed').length || 0;

            // Get last 10 calls
            const lastCalls = calls?.slice(0, 10) || [];
            const callsListHtml = lastCalls.length > 0 ? `
                <div style="margin-top: 30px; border-top: 1px solid #1F2937; padding-top: 20px;">
                    <p style="font-size: 13px; font-weight: 800; color: #FFFFFF; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.05em;">Últimas 10 llamadas</p>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: rgba(232, 236, 241, 0.8);">
                        <thead>
                            <tr style="text-align: left; border-bottom: 1px solid #1F2937;">
                                <th style="padding: 10px 5px;">Fecha</th>
                                <th style="padding: 10px 5px;">Teléfono</th>
                                <th style="padding: 10px 5px;">Duración</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${lastCalls.map(c => `
                                <tr style="border-bottom: 1px solid #141A23;">
                                    <td style="padding: 10px 5px;">${format(new Date(c.created_at), 'dd/MM HH:mm')}</td>
                                    <td style="padding: 10px 5px;">${c.phone_number || 'Oculto'}</td>
                                    <td style="padding: 10px 5px;">${c.call_duration_seconds}s</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '';

            // 4. Low Balance Alert
            const isLowBalance = (client.balance || 0) < (prefs.low_balance_threshold || 10);
            const balanceAlertHtml = isLowBalance ? `
                <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 16px; padding: 20px; margin-bottom: 25px;">
                    <p style="margin: 0; font-size: 14px; font-weight: 800; color: #EF4444;">ALERTA DE SALDO BAJO</p>
                    <p style="margin: 5px 0 0 0; font-size: 13px; color: rgba(232, 236, 241, 0.8);">Tu saldo actual es de <strong>${client.balance?.toFixed(2)}€</strong>. Por favor, realiza una recarga para evitar que el servicio se detenga.</p>
                </div>
            ` : '';

            // 5. Send Email via Resend
            const typeLabel = type === 'daily' ? 'Diario' : (type === 'weekly' ? 'Semanal' : 'Mensual');
            const subject = `Resumen ${typeLabel} de Actividad - ${client.name}`;

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
                                    <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; color: #FFFFFF;">Mili y son-ia</h1>
                                    <p style="margin: 8px 0 0 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #008DCB;">Resumen ${typeLabel}</p>
                                </div>

                                <!-- Body -->
                                <div style="padding: 0 40px 40px 40px;">
                                    ${balanceAlertHtml}

                                    <p style="font-size: 15px; line-height: 1.6; color: rgba(232, 236, 241, 0.7); margin-bottom: 30px;">
                                        Actividad de <strong>${client.name}</strong> para el periodo analizado:
                                    </p>

                                    <!-- Stats Grid -->
                                    <div style="display: table; width: 100%; border-collapse: separate; border-spacing: 12px 0; margin: 0 -12px 20px -12px;">
                                        <div style="display: table-row;">
                                            <div style="display: table-cell; width: 50%; background-color: #141A23; border: 1px solid #1F2937; border-radius: 16px; padding: 20px;">
                                                <p style="margin: 0; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #4B5563;">LLAMADAS</p>
                                                <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 900; color: #008DCB;">${totalCalls}</p>
                                            </div>
                                            <div style="display: table-cell; width: 50%; background-color: #141A23; border: 1px solid #1F2937; border-radius: 16px; padding: 20px;">
                                                <p style="margin: 0; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #4B5563;">DURACIÓN</p>
                                                <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 900; color: #008DCB;">${Math.round(totalDuration / 60)}'</p>
                                            </div>
                                        </div>
                                    </div>

                                    ${callsListHtml}

                                    <!-- CTA -->
                                    <div style="text-align: center; margin-top: 40px;">
                                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/${client.slug}" style="display: inline-block; background-color: #008DCB; color: #FFFFFF; font-size: 13px; font-weight: 900; text-decoration: none; padding: 18px 32px; border-radius: 16px; text-transform: uppercase; letter-spacing: 0.05em;">
                                            Panel de Control
                                        </a>
                                    </div>
                                </div>

                                <!-- Footer -->
                                <div style="padding: 30px; border-top: 1px solid #1F2937; text-align: center; background-color: #0B0E14;">
                                    <p style="margin: 0; font-size: 11px; font-weight: 600; color: #4B5563; line-height: 1.5;">
                                        Informe generado por Mili y son-ia.<br>
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
