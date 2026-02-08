-- Add status column to clients table
-- This migration adds a status field to track the client's current phase in the pipeline

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Cliente';

-- Add constraint to ensure only valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'clients_status_check'
  ) THEN
    ALTER TABLE clients 
    ADD CONSTRAINT clients_status_check 
    CHECK (status IN (
      'Cliente', 
      'Recogiendo briefing', 
      'Implementando agente', 
      'Entregado', 
      'Testeo', 
      'Mantenimiento mensual'
    ));
  END IF;
END
$$;

-- Update existing clients to have default status if null
UPDATE clients 
SET status = 'Cliente' 
WHERE status IS NULL;

-- Verify the changes
SELECT id, name, status FROM clients LIMIT 5;
