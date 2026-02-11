-- Update the check constraint for the 'status' column in the 'clients' table
-- This allows the new sales pipeline stages to be saved without error.

ALTER TABLE public.clients
DROP CONSTRAINT IF EXISTS clients_status_check;

ALTER TABLE public.clients
ADD CONSTRAINT clients_status_check
CHECK (status IN (
  'Cita programada',
  'Presupuesto enviado',
  'Intención de compra',
  'Cliente ganado',
  'Cliente perdido',
  'Recogiendo briefing',
  'Implementando agente',
  'Entregado',
  'Testeo',
  'Mantenimiento mensual',
  'Cliente' -- Keeping 'Cliente' for backward compatibility with existing rows, even if not used in UI
));
