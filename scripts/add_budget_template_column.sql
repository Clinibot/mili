-- Add budget_template_url column to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS budget_template_url text;
