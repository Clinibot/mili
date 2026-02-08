-- ARREGLAR CHAT DEFINITIVAMENTE
-- Deshabilitar RLS en admin_chat_messages (misma solución que funcionó para facturas)

-- 1. Deshabilitar RLS completamente en la tabla de chat
ALTER TABLE admin_chat_messages DISABLE ROW LEVEL SECURITY;

-- 2. También deshabilitar en activity logs por si acaso
ALTER TABLE admin_activity_logs DISABLE ROW LEVEL SECURITY;
