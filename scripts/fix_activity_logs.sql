-- ARREGLAR ACTIVIDAD LOGS
-- Deshabilitar RLS para que funcione el registro de actividad

ALTER TABLE admin_activity_logs DISABLE ROW LEVEL SECURITY;
