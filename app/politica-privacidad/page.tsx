import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Política de Privacidad - Mili y son-ia',
    robots: {
        index: false,
        follow: false,
    },
};

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#070A0F] text-[#E8ECF1] p-8 lg:p-20 font-sans">
            <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-4xl font-black text-white">Política de Privacidad</h1>

                <section className="space-y-4 text-[rgba(232,236,241,0.7)] leading-relaxed">
                    <p>
                        En Mili y son-ia, nos tomamos muy en serio la privacidad de nuestros usuarios. Esta página detalla cómo manejamos la información dentro de nuestra plataforma de gestión de agentes de voz.
                    </p>

                    <h2 className="text-xl font-bold text-white pt-4">1. Recopilación de Datos</h2>
                    <p>
                        Solo recopilamos los datos estrictamente necesarios para el funcionamiento de los agentes de voz y la gestión de citas de nuestros clientes, incluyendo nombres, teléfonos y correos electrónicos de contacto proporcionados voluntariamente.
                    </p>

                    <h2 className="text-xl font-bold text-white pt-4">2. Uso de la Información</h2>
                    <p>
                        La información se utiliza exclusivamente para:
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li>Procesar y gestionar llamadas a través de nuestros agentes de IA.</li>
                            <li>Sincronizar citas con Google Calendar (si el cliente lo autoriza).</li>
                            <li>Enviar alertas de actividad y saldo.</li>
                        </ul>
                    </p>

                    <h2 className="text-xl font-bold text-white pt-4">3. Seguridad</h2>
                    <p>
                        Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos contra acceso no autorizado, alteración o destrucción.
                    </p>

                    <h2 className="text-xl font-bold text-white pt-4">4. Contacto</h2>
                    <p>
                        Para cualquier duda sobre su privacidad, puede contactar con Mili Pérez o Sonia Ortiz a través de los canales habituales de soporte.
                    </p>
                </section>

                <footer className="pt-10 border-top border-[#1F2937] text-xs text-[#4B5563]">
                    Última actualización: Febrero 2026
                </footer>
            </div>
        </div>
    );
}
