-- FIX: Corregir permisos de facturas para que Mili vea lo mismo que Sonia

-- 1. Habilitar RLS (Row Level Security)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas que puedan estar bloqueando el acceso
DROP POLICY IF EXISTS "Allow all for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON invoices;
DROP POLICY IF EXISTS "Public invoices access" ON invoices;

-- 3. Crear política PERMISIVA UNIVERSAL para usuarios logueados
-- Esto hace que SI estás logueado, PUEDES ver/editar TODO en facturas.
CREATE POLICY "Enable all access for authenticated users" ON invoices
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Asegurar permisos en el Storage (archivos de facturas)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Invoices Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Invoices Authenticated Insert" ON storage.objects;

CREATE POLICY "Invoices Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'invoices');
CREATE POLICY "Invoices Authenticated Insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'invoices');
CREATE POLICY "Invoices Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'invoices');
