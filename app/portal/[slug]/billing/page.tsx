"use client";

import { usePortal } from '../PortalContext';
import WalletSection from '../WalletSection';

export default function BillingPage() {
    const { client } = usePortal();

    if (!client) return null;

    return (
        <div className="max-w-4xl mx-auto p-6 lg:p-12 space-y-12">
            <div>
                <p className="text-blue-600 font-sans text-xs uppercase tracking-[0.2em] mb-2 font-bold text-center">Gestión Financiera</p>
                <h2 className="font-header text-4xl font-black tracking-tight text-slate-900 text-center">Pagos y Suscripción</h2>
                <p className="text-slate-500 text-center mt-4 max-w-lg mx-auto">
                    Gestiona tu saldo para llamadas, configura tu suscripción mensual y revisa tus métodos de pago.
                </p>
            </div>

            <div className="max-w-2xl mx-auto">
                <WalletSection clientId={client.id} />
            </div>
        </div>
    );
}
