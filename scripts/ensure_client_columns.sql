-- Ensure all columns involved in client creation exist
-- Run this script in Supabase SQL Editor to fix "Error creating..." issues due to missing columns

-- 1. Notes (added recently)
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS notes text;

-- 2. Budget Template URL (added recently)
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS budget_template_url text;

-- 3. Portal Credentials & Setup (from migrations)
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS portal_user text; -- Removed UNIQUE to avoid issues if empty strings are used, or handle application side

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS portal_password text;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS webhook_token text;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS slug text; -- Removed UNIQUE constraint in SQL to avoid conflict on empty strings, managed by app logic

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 0;

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'none';

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS subscription_amount numeric DEFAULT 0;

-- 4. Ensure RLS policies don't block inserts
-- (Re-applying policies safely)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Enable insert for all users') THEN
    CREATE POLICY "Enable insert for all users" ON public.clients FOR INSERT WITH CHECK (true);
  END IF;
  
   IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Enable update for all users') THEN
    CREATE POLICY "Enable update for all users" ON public.clients FOR UPDATE USING (true);
  END IF;
  
   IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Enable insert for all users') THEN
    CREATE POLICY "Enable insert for all users" ON public.agents FOR INSERT WITH CHECK (true);
  END IF;
  
   IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Enable update for all users') THEN
    CREATE POLICY "Enable update for all users" ON public.agents FOR UPDATE USING (true);
  END IF;
END $$;
