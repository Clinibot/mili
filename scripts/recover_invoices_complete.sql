-- RECUPERACIÓN COMPLETA DE FACTURAS
-- Este script arregla TANTO la visualización como la subida

-- ========================================
-- PARTE 1: ARREGLAR TABLA INVOICES (Para ver las facturas existentes)
-- ========================================

-- Limpiar políticas antiguas de la tabla
DROP POLICY IF EXISTS "Allow all for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Public invoices access" ON invoices;
DROP POLICY IF EXISTS "Super Admin Access" ON invoices;
DROP POLICY IF EXISTS "policy_allow_all" ON invoices;

-- Habilitar RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Crear política permisiva
CREATE POLICY "Super Admin Access" ON invoices
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ========================================
-- PARTE 2: ARREGLAR STORAGE (Para subir nuevas facturas)
-- ========================================

-- Borrar TODAS las políticas de storage
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname LIKE '%invoice%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Asegurar que el bucket es público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'invoices';

-- Crear UNA política permisiva para storage
CREATE POLICY "invoices_authenticated_access"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'invoices')
WITH CHECK (bucket_id = 'invoices');
