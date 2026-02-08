-- ALTERNATIVA: GUARDAR FACTURAS SIN ARCHIVO TEMPORALMENTE
-- Ejecuta esto si storage_nuclear.sql tampoco funciona

-- Esta migración hace que document_url sea nullable
-- Así puedes crear facturas sin archivo mientras arreglamos storage

ALTER TABLE invoices 
ALTER COLUMN document_url DROP NOT NULL;
