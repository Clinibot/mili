-- DESACTIVAR RLS EN STORAGE PARA EL BUCKET INVOICES
-- Esto permitirá subir archivos sin restricciones

-- Primero, eliminar todas las políticas del bucket invoices
DROP POLICY IF EXISTS "allow_all_authenticated_invoices" ON storage.objects;
DROP POLICY IF EXISTS "Invoices Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Invoices Authenticated Insert" ON storage.objects;
DROP POLICY IF EXISTS "Invoices Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Invoices Authenticated Update" ON storage.objects;

-- IMPORTANTE: No crear nuevas políticas
-- Cuando un bucket es público y no tiene políticas RLS, permite acceso libre

-- Alternativamente, crear UNA política super-permisiva
CREATE POLICY "public_invoices_full_access"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'invoices')
WITH CHECK (bucket_id = 'invoices');
