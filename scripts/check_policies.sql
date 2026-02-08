-- Ver políticas actuales en la tabla invoices
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'invoices';

-- Ver políticas de storage
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
