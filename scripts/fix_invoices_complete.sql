-- SOLUCIÓN COMPLETA PARA FACTURAS
-- Este script arregla TODOS los problemas de facturas de una vez

-- ========================================
-- PARTE 1: ARREGLAR TABLA INVOICES (RLS)
-- ========================================

-- Limpiar políticas antiguas
DROP POLICY IF EXISTS "Allow all for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Public invoices access" ON invoices;
DROP POLICY IF EXISTS "Super Admin Access" ON invoices;
DROP POLICY IF EXISTS "policy_allow_all" ON invoices;

-- Habilitar RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Crear política permisiva para todos los admins autenticados
CREATE POLICY "Super Admin Access" ON invoices
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ========================================
-- PARTE 2: ARREGLAR STORAGE BUCKET
-- ========================================

-- Crear bucket si no existe (hacer público para que las facturas se puedan ver)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ========================================
-- PARTE 3: ARREGLAR POLÍTICAS DE STORAGE
-- ========================================

-- Limpiar políticas antiguas de storage
DROP POLICY IF EXISTS "Invoices Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Invoices Authenticated Insert" ON storage.objects;
DROP POLICY IF EXISTS "Invoices Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Invoices Authenticated Update" ON storage.objects;

-- Permitir lectura pública (para ver archivos subidos)
CREATE POLICY "Invoices Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoices');

-- Permitir subida a usuarios autenticados
CREATE POLICY "Invoices Authenticated Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Permitir actualización a usuarios autenticados
CREATE POLICY "Invoices Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'invoices');

-- Permitir borrado a usuarios autenticados
CREATE POLICY "Invoices Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'invoices');
