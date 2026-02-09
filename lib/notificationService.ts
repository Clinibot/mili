import { supabase } from './supabaseClient';

export type NotificationType = 'low_balance' | 'balance_recharged' | 'custom';

export interface ClientNotification {
    id: string;
    client_id: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
}

/**
 * Crea una notificación para un cliente
 */
export async function createNotification(
    clientId: string,
    type: NotificationType,
    title: string,
    message: string
): Promise<void> {
    try {
        const { error } = await supabase
            .from('client_notifications')
            .insert({
                client_id: clientId,
                type,
                title,
                message
            });

        if (error) {
            console.error('[NOTIFICATION] Error creando notificación:', error);
        } else {
            console.log('[NOTIFICATION] ✅ Notificación creada:', title);
        }
    } catch (err) {
        console.error('[NOTIFICATION] Error inesperado:', err);
    }
}

/**
 * Detecta si el saldo es bajo y crea notificación + email
 */
export async function checkLowBalance(
    clientId: string,
    clientEmail: string,
    currentBalance: number,
    previousBalance: number
): Promise<void> {
    const LOW_BALANCE_THRESHOLD = 5;

    // Solo notificar cuando cruza el umbral (evita spam)
    if (currentBalance < LOW_BALANCE_THRESHOLD && previousBalance >= LOW_BALANCE_THRESHOLD) {
        const title = '⚠️ Saldo Bajo';
        const message = `Tu saldo es de €${currentBalance.toFixed(2)}. Recarga pronto para seguir usando el servicio.`;

        // Crear notificación in-app
        await createNotification(clientId, 'low_balance', title, message);

        // Enviar email
        await sendEmailNotification(clientEmail, title, message);
    }
}

/**
 * Notifica recarga de saldo
 */
export async function notifyBalanceRecharge(
    clientId: string,
    clientEmail: string,
    amount: number,
    newBalance: number
): Promise<void> {
    const title = '💰 Saldo Recargado';
    const message = `Se han añadido €${amount.toFixed(2)} a tu cuenta. Nuevo saldo: €${newBalance.toFixed(2)}`;

    // Crear notificación in-app
    await createNotification(clientId, 'balance_recharged', title, message);

    // Enviar email
    await sendEmailNotification(clientEmail, title, message);
}

/**
 * Envía email vía API route (Resend)
 */
async function sendEmailNotification(
    to: string,
    subject: string,
    message: string
): Promise<void> {
    try {
        const response = await fetch('/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, message })
        });

        if (!response.ok) {
            console.error('[NOTIFICATION] Error enviando email:', await response.text());
        } else {
            console.log('[NOTIFICATION] ✅ Email enviado a:', to);
        }
    } catch (err) {
        console.error('[NOTIFICATION] Error al enviar email:', err);
    }
}
