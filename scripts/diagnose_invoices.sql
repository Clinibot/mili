-- DIAGNÓSTICO: VER QUÉ HAY EN LA BASE DE DATOS
-- Ejecuta esto para ver si las facturas siguen ahí

-- Ver todas las facturas sin RLS (como admin)
SELECT * FROM invoices ORDER BY created_at DESC LIMIT 20;

-- Ver cuántas facturas hay en total
SELECT COUNT(*) as total_facturas FROM invoices;

-- Ver archivos en el bucket de storage
SELECT name, created_at 
FROM storage.objects 
WHERE bucket_id = 'invoices' 
ORDER BY created_at DESC 
LIMIT 20;
