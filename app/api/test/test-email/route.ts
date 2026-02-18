import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'alertas@centrodemando.es';

export async function GET(req: NextRequest) {
    const to = req.nextUrl.searchParams.get('to') || 'sonia@son-ia.online';

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [to],
            subject: 'Prueba de Alertas - Mili y son-ia',
            html: `
                <div style="background-color: #070A0F; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E8ECF1; margin: 0; width: 100% !important;">
                    <center>
                        <div style="max-width: 600px; text-align: left; background-color: #0E1219; border: 1px solid #1F2937; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
                            <!-- Header -->
                            <div style="padding: 40px; text-align: center; background: linear-gradient(180deg, rgba(0, 141, 203, 0.1) 0%, rgba(0, 0, 0, 0) 100%);">
                                <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; color: #FFFFFF;">Mili y son-ia</h1>
                                <p style="margin: 8px 0 0 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #008DCB;">Prueba de Sistema</p>
                            </div>

                            <!-- Body -->
                            <div style="padding: 0 40px 40px 40px;">
                                <h2 style="color: #FFFFFF; font-size: 18px; font-weight: 800; margin-bottom: 16px;">Configuración completada</h2>
                                <p style="font-size: 15px; line-height: 1.6; color: rgba(232, 236, 241, 0.7); margin-bottom: 30px;">
                                    Hola Sonia, esta es la nueva versión de los emails de Mili y son-ia. Hemos eliminado los iconos y emojis para un diseño más sobrio y profesional.
                                </p>

                                <!-- Sample History -->
                                <div style="margin-top: 30px; border-top: 1px solid #1F2937; padding-top: 20px;">
                                    <p style="font-size: 13px; font-weight: 800; color: #FFFFFF; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.05em;">Ejemplo de Historial</p>
                                    <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: rgba(232, 236, 241, 0.8);">
                                        <thead>
                                            <tr style="text-align: left; border-bottom: 1px solid #1F2937;">
                                                <th style="padding: 10px 5px;">Fecha</th>
                                                <th style="padding: 10px 5px;">Teléfono</th>
                                                <th style="padding: 10px 5px;">Duración</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr style="border-bottom: 1px solid #141A23;">
                                                <td style="padding: 10px 5px;">Hoy 15:20</td>
                                                <td style="padding: 10px 5px;">+34 600 000 000</td>
                                                <td style="padding: 10px 5px;">124s</td>
                                            </tr>
                                            <tr style="border-bottom: 1px solid #141A23;">
                                                <td style="padding: 10px 5px;">Hoy 14:45</td>
                                                <td style="padding: 10px 5px;">+34 611 111 111</td>
                                                <td style="padding: 10px 5px;">45s</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <!-- CTA -->
                                <div style="text-align: center; margin-top: 40px;">
                                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal" style="display: inline-block; background-color: #008DCB; color: #FFFFFF; font-size: 13px; font-weight: 900; text-decoration: none; padding: 18px 32px; border-radius: 16px; text-transform: uppercase; letter-spacing: 0.05em;">
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

        if (error) return NextResponse.json({ error }, { status: 500 });
        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
