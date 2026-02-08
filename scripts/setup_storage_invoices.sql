-- PASO 1: Crear el bucket 'invoices' si no existe
-- Ve a Supabase > SQL Editor y ejecuta esto:

-- Intentar crear el bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- PASO 2: Configurar políticas de acceso
-- Borrar políticas antiguas si existen para evitar duplicados
DROP POLICY IF EXISTS "Invoices Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Invoices Authenticated Insert" ON storage.objects;
DROP POLICY IF EXISTS "Invoices Authenticated Delete" ON storage.objects;

-- Permitir acceso público de lectura (para ver los archivos)
CREATE POLICY "Invoices Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoices');

-- Permitir subida a usuarios autenticados
CREATE POLICY "Invoices Authenticated Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Permitir borrado a usuarios autenticados
CREATE POLICY "Invoices Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'invoices');
