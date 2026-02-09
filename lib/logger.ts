import { supabase } from './supabaseClient';
import { toast } from 'sonner';

/**
 * Registra una acción en el feed de actividad de administradores.
 * @param adminEmail Email del admin que realiza la acción
 * @param action Nombre corto de la acción (ej: "Crear Cliente", "Nuevo Gasto")
 * @param details Descripción detallada (ej: "Se creó el cliente Empresa S.L.")
 * @param metadata Objeto opcional con datos técnicos (ej: { clientId: '...' })
 */
export async function logAdminAction(adminEmail: string, action: string, details: string, metadata: any = {}) {
    try {
        console.log('[LOGGER] 🔵 Iniciando logAdminAction');
        console.log('[LOGGER] 📧 Email:', adminEmail);
        console.log('[LOGGER] ⚡ Action:', action);
        console.log('[LOGGER] 📝 Details:', details);

        if (!adminEmail) {
            console.error('[LOGGER] ❌ No se proporcionó email del admin');
            return;
        }

        console.log('[LOGGER] 💾 Insertando en Supabase...');
        const { data, error } = await supabase
            .from('admin_activity_logs')
            .insert({
                admin_email: adminEmail,
                action,
                details,
                metadata
            })
            .select();

        if (error) {
            console.error('[LOGGER] ❌ Error insertando log:', error);
            console.error('[LOGGER] ❌ Error code:', error.code);
            console.error('[LOGGER] ❌ Error message:', error.message);
            console.error('[LOGGER] ❌ Error details:', error.details);
            toast.error(`Error registrando actividad: ${error.message}`);
        } else {
            console.log('[LOGGER] ✅ Log registrado exitosamente!');
            console.log('[LOGGER] ✅ Data:', data);
        }
    } catch (err) {
        console.error('[LOGGER] ❌ Error inesperado:', err);
        toast.error('Error inesperado registrando actividad');
    }
}
