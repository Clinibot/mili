-- SCRIPT "NUCLEAR" PARA ARREGLAR PERMISOS DE FACTURAS
-- Este script busca y borra TODAS las políticas existentes en la tabla invoices automáticamente
-- y luego crea una única política permisiva.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'invoices') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON invoices';
    END LOOP;
END $$;

-- Asegurarnos que RLS está activo
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Crear la política única y permisiva
CREATE POLICY "Super Admin Access" ON invoices
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verificación (opcional, para ver si hay políticas)
SELECT * FROM pg_policies WHERE tablename = 'invoices';
