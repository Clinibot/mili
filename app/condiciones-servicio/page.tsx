import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Condiciones del Servicio - Mili y son-ia',
    robots: {
        index: false,
        follow: false,
    },
};

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-[#070A0F] text-[#E8ECF1] p-8 lg:p-20 font-sans">
            <div className="max-w-3xl mx-auto space-y-8">
                <h1 className="text-4xl font-black text-white">Condiciones del Servicio</h1>

                <section className="space-y-4 text-[rgba(232,236,241,0.7)] leading-relaxed">
                    <p>
                        Bienvenido a Mili y son-ia. Al utilizar nuestra plataforma, usted acepta los siguientes términos.
                    </p>

                    <h2 className="text-xl font-bold text-white pt-4">1. Descripción del Servicio</h2>
                    <p>
                        Somos creadores de agentes de voz para llamadas basados en inteligencia artificial. Esta plataforma es para uso exclusivo de los clientes de Mili Pérez y Sonia Ortiz para la gestión de sus agentes y citas.
                    </p>

                    <h2 className="text-xl font-bold text-white pt-4">2. Uso Exclusivo</h2>
                    <p>
                        El acceso a https://centrodemando.es está restringido a clientes autorizados. El uso no autorizado de esta plataforma está estrictamente prohibido.
                    </p>

                    <h2 className="text-xl font-bold text-white pt-4">3. Responsabilidad</h2>
                    <p>
                        El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso. Mili y son-ia no se hace responsable de las llamadas o acciones realizadas por los agentes de IA fuera de los parámetros configurados por el cliente. Para más información o soporte técnico contactar con Sonia Ortiz.
                    </p>

                    <h2 className="text-xl font-bold text-white pt-4">4. Propiedad Intelectual</h2>
                    <p>
                        Todos los derechos sobre la tecnología de los agentes de voz y la interfaz de la plataforma pertenecen a Mili y son-ia.
                    </p>
                </section>

                <footer className="pt-10 border-top border-[#1F2937] text-xs text-[#4B5563]">
                    Última actualización: Febrero 2026
                </footer>
            </div>
        </div>
    );
}
