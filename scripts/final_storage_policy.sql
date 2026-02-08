-- SCRIPT FINAL - POLÍTICA ÚNICA PARA STORAGE
-- Ejecutar DESPUÉS de borrar todas las políticas desde la UI

CREATE POLICY "invoices_full_access"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'invoices')
WITH CHECK (bucket_id = 'invoices');
