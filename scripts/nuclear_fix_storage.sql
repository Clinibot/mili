-- SOLUCIÓN NUCLEAR PARA STORAGE
-- Usar SOLO si fix_invoices_complete.sql no funcionó

-- 1. Eliminar TODAS las políticas del bucket invoices
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname LIKE '%nvoice%'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- 2. Crear bucket público
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Crear política ultra-permisiva para authenticated
CREATE POLICY "allow_all_authenticated_invoices"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'invoices')
WITH CHECK (bucket_id = 'invoices');
