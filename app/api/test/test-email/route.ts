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
            subject: '🚀 Prueba de Alertas - Mili IA',
            html: `
                <div style="background-color: #070A0F; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E8ECF1; margin: 0; width: 100% !important;">
                    <center>
                        <div style="max-width: 600px; text-align: left; background-color: #0E1219; border: 1px solid #1F2937; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
                            <!-- Header -->
                            <div style="padding: 40px; text-align: center; background: linear-gradient(180deg, rgba(0, 141, 203, 0.1) 0%, rgba(0, 0, 0, 0) 100%);">
                                <div style="background-color: rgba(0, 141, 203, 0.1); width: 64px; height: 64px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; border: 1px solid rgba(0, 141, 203, 0.2);">
                                    <span style="font-size: 32px;">✨</span>
                                </div>
                                <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; color: #FFFFFF;">Mili IA</h1>
                                <p style="margin: 8px 0 0 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #008DCB;">Prueba de Sistema</p>
                            </div>

                            <!-- Body -->
                            <div style="padding: 0 40px 40px 40px;">
                                <h2 style="color: #FFFFFF; font-size: 18px; font-weight: 800; margin-bottom: 16px;">¡Configuración completada!</h2>
                                <p style="font-size: 15px; line-height: 1.6; color: rgba(232, 236, 241, 0.7); margin-bottom: 30px;">
                                    Hola Sonia, esta es una prueba de la estética de las nuevas alertas por email de Mili IA. Como puedes ver, ahora sigue la misma línea visual premium de la aplicación: modo oscuro, acentos azules y tipografía moderna.
                                </p>

                                <div style="background-color: #141A23; border: 1px solid #1F2937; border-radius: 16px; padding: 25px; margin-bottom: 40px;">
                                    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                                        <div style="color: #008DCB; font-weight: 800; font-size: 14px;">✓</div>
                                        <div style="font-size: 14px; color: #E8ECF1;">Diseño Dark Mode Premium</div>
                                    </div>
                                    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                                        <div style="color: #008DCB; font-weight: 800; font-size: 14px;">✓</div>
                                        <div style="font-size: 14px; color: #E8ECF1;">Resúmenes Diarios y Semanales</div>
                                    </div>
                                    <div style="display: flex; gap: 12px;">
                                        <div style="color: #008DCB; font-weight: 800; font-size: 14px;">✓</div>
                                        <div style="font-size: 14px; color: #E8ECF1;">Alertas de Saldo en tiempo real</div>
                                    </div>
                                </div>

                                <!-- CTA -->
                                <div style="text-align: center;">
                                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal" style="display: inline-block; background-color: #008DCB; color: #FFFFFF; font-size: 14px; font-weight: 900; text-decoration: none; padding: 18px 32px; border-radius: 16px; box-shadow: 0 8px 20px rgba(0, 141, 203, 0.3);">
                                        VOLVER AL PANEL
                                    </a>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div style="padding: 30px; border-top: 1px solid #1F2937; text-align: center; background-color: #0B0E14;">
                                <p style="margin: 0; font-size: 11px; font-weight: 600; color: #4B5563; line-height: 1.5;">
                                    Este es un email de prueba del sistema Mili IA.<br>
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
