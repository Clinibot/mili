import { supabase } from './supabaseClient';
import { toast } from 'sonner';

/**
 * Registra una acción en el feed de actividad de administradores.
 * @param action Nombre corto de la acción (ej: "Crear Cliente", "Nuevo Gasto")
 * @param details Descripción detallada (ej: "Se creó el cliente Empresa S.L.")
 * @param metadata Objeto opcional con datos técnicos (ej: { clientId: '...' })
 */
export async function logAdminAction(action: string, details: string, metadata: any = {}) {
    try {
        console.log('[LOGGER] Intentando registrar acción:', action, details);

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
            console.error('[LOGGER] Error obteniendo usuario:', userError);
            return;
        }

        if (!user || !user.email) {
            console.error('[LOGGER] No hay usuario autenticado o email');
            return;
        }

        console.log('[LOGGER] Usuario:', user.email);

        const { data, error } = await supabase
            .from('admin_activity_logs')
            .insert({
                admin_email: user.email,
                action,
                details,
                metadata
            })
            .select();

        if (error) {
            console.error('[LOGGER] Error insertando log:', error);
            toast.error(`Error registrando actividad: ${error.message}`);
        } else {
            console.log('[LOGGER] ✅ Log registrado exitosamente:', data);
        }
    } catch (err) {
        console.error('[LOGGER] Error inesperado:', err);
        toast.error('Error inesperado registrando actividad');
    }
}
