import { supabase } from './supabaseClient';

/**
 * Registra una acción en el feed de actividad de administradores.
 * @param action Nombre corto de la acción (ej: "Crear Cliente", "Nuevo Gasto")
 * @param details Descripción detallada (ej: "Se creó el cliente Empresa S.L.")
 * @param metadata Objeto opcional con datos técnicos (ej: { clientId: '...' })
 */
export async function logAdminAction(action: string, details: string, metadata: any = {}) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return;

        const { error } = await supabase
            .from('admin_activity_logs')
            .insert({
                admin_email: user.email,
                action,
                details,
                metadata
            });

        if (error) {
            console.error('Error logging admin action:', error);
        }
    } catch (err) {
        console.error('Unexpected error logging action:', err);
    }
}
