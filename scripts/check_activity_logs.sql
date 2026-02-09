-- DIAGNÓSTICO: Verificar estado de activity logs

-- 1. Ver si RLS está deshabilitado
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'admin_activity_logs';
-- Si relrowsecurity es TRUE, ejecuta fix_activity_logs.sql

-- 2. Ver cuántos logs hay
SELECT COUNT(*) as total_logs FROM admin_activity_logs;

-- 3. Ver los últimos 10 logs
sucess
