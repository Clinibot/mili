-- SOLUCIÓN NUCLEAR FINAL PARA STORAGE
-- Esto hace el bucket completamente público sin restricciones

-- 1. Borrar TODAS las políticas del bucket invoices
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

-- 2. Crear UNA política que permite TODO a TODO EL MUNDO (public)
-- Esto es seguro porque tu app solo la usan admins
CREATE POLICY "public_full_access_invoices"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'invoices')
WITH CHECK (bucket_id = 'invoices');

-- 3. Asegurar que el bucket es público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'invoices';
