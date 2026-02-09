-- Verificar configuración de la tabla admin_activity_logs
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'admin_activity_logs';

-- Ver políticas activas
SELECT * FROM pg_policies WHERE tablename = 'admin_activity_logs';

-- Contar registros
SELECT COUNT(*) FROM admin_activity_logs;

-- Ver últimos 5 registros
SELECT * FROM admin_activity_logs ORDER BY created_at DESC LIMIT 5;
