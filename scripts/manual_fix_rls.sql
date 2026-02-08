-- SCRIPT MANUAL (A prueba de fallos)
-- Ejecuta esto tal cual en Supabase

-- 1. Intentar borrar todas las políticas posibles por nombre (si alguna da error, ignóralo y sigue)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Public invoices access" ON invoices;
DROP POLICY IF EXISTS "Super Admin Access" ON invoices;
DROP POLICY IF EXISTS "policy_allow_all" ON invoices;

-- 2. Asegurar RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- 3. Crear la ÚNICA política necesaria
CREATE POLICY "Super Admin Access" ON invoices
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Permisos de Storage (por si acaso)
DROP POLICY IF EXISTS "Invoices Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Invoices Authenticated Insert" ON storage.objects;
DROP POLICY IF EXISTS "Invoices Authenticated Delete" ON storage.objects;

CREATE POLICY "Invoices Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'invoices');
CREATE POLICY "Invoices Authenticated Insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'invoices');
CREATE POLICY "Invoices Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'invoices');
