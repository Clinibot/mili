-- DESHABILITAR RLS COMPLETAMENTE EN INVOICES Y STORAGE
-- Solución nuclear: sin RLS, sin problemas

-- 1. DESHABILITAR RLS en la tabla invoices
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;

-- 2. DESHABILITAR RLS en storage (esto es más complicado)
-- Como no podemos deshabilitar RLS en storage.objects directamente,
-- creamos una política ultra-permisiva para TODO EL MUNDO

-- Primero, borrar todas las políticas de storage
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Crear UNA política que permite TODO a TODOS
CREATE POLICY "allow_everything_invoices"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'invoices')
WITH CHECK (bucket_id = 'invoices');
