-- Script para corregir el slug del cliente tras pruebas
-- PROBLEMA: Durante las pruebas se cambió el nombre varias veces
-- y el slug se regeneró, ahora no coincide con la URL esperada

-- Paso 1: Ver el slug actual del cliente
SELECT id, name, slug
FROM clients
WHERE name ILIKE '%cliente%'
ORDER BY created_at DESC;

-- Paso 2: Corregir el slug para que coincida con la URL
-- Reemplaza 'TU-CLIENT-ID' con el ID real del cliente
UPDATE clients
SET slug = 'cliente-cuatro'
WHERE id = '2588feec-1290-42e2-9201-fb6e5f73051f';

-- Paso 3: Verificar el cambio
SELECT id, name, slug
FROM clients
WHERE id = '2588feec-1290-42e2-9201-fb6e5f73051f';

-- Nota: Si prefieres usar un slug más descriptivo:
-- UPDATE clients SET slug = 'nombrecliente' WHERE id = 'TU-CLIENT-ID';
