# Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env.local`:

```env
# Resend API Key (para enviar emails)
RESEND_API_KEY=re_your_api_key_here

# Email remitente verificado en Resend
RESEND_FROM_EMAIL=noreply@tudominio.com
```

## Cómo obtener RESEND_API_KEY:

1. Ve a https://resend.com
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys** en el dashboard
4. Crea una nueva API key
5. Copi a y pégala en `.env.local`

## Cómo configurar el email remitente:

1. En Resend dashboard, ve a **Domains**
2. Verifica tu dominio (o usa el dominio de prueba temporal)
3. Copia el email verificado a `RESEND_FROM_EMAIL`

## Pasos de implementación:

1. ✅ Ejecuta `scripts/create_notifications_table.sql` en Supabase SQL Editor
2. ✅ Añade las variables de entorno a `.env.local`
3. ✅ Reinicia el servidor: `npm run dev`
4. ✅ Prueba regalando saldo a un cliente
5. ✅ El cliente debería recibir:
   - Notificación in-app en la campanita del portal
   - Email a su `contact_email`

El sistema de actividad logs **todavía requiere que configures el email del usuario** en las páginas que faltaron actualizar (como `app/clients/[id]/page.tsx`).
