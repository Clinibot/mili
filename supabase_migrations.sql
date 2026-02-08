-- ================================================================
-- SUPABASE MIGRATIONS - IA PARA LLAMADAS
-- Execute this entire file in your Supabase SQL Editor
-- ================================================================

-- 1. ADD PORTAL CREDENTIALS TO CLIENTS TABLE
-- ================================================================
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS portal_user text UNIQUE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS portal_password text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS webhook_token text;

-- 2. CREATE CALLS TABLE FOR WEBHOOK DATA
-- ================================================================
CREATE TABLE IF NOT EXISTS public.calls (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  call_id text UNIQUE NOT NULL,
  agent_id text,
  call_type text,
  direction text,
  call_status text,
  start_timestamp bigint,
  end_timestamp bigint,
  duration_seconds integer,
  disconnection_reason text,
  transcript text,
  recording_url text,
  from_number text,
  to_number text,
  
  -- Analysis Data
  call_summary text,
  user_sentiment text,
  call_successful boolean,
  in_voicemail boolean,
  custom_analysis_data jsonb
);

-- Enable RLS on calls table
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- 3. ADD DELETE POLICIES TO ALL TABLES
-- ================================================================
-- For clients table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clients' 
    AND policyname = 'Enable delete for all users'
  ) THEN
    CREATE POLICY "Enable delete for all users" ON public.clients FOR DELETE USING (true);
  END IF;
END $$;

-- For agents table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agents' 
    AND policyname = 'Enable delete for all users'
  ) THEN
    CREATE POLICY "Enable delete for all users" ON public.agents FOR DELETE USING (true);
  END IF;
END $$;

-- For invoices table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'invoices' 
    AND policyname = 'Enable delete for all users'
  ) THEN
    CREATE POLICY "Enable delete for all users" ON public.invoices FOR DELETE USING (true);
  END IF;
END $$;

-- For calls table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'calls' 
    AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON public.calls FOR SELECT USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'calls' 
    AND policyname = 'Enable insert for all users'
  ) THEN
    CREATE POLICY "Enable insert for all users" ON public.calls FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'calls' 
    AND policyname = 'Enable delete for all users'
  ) THEN
    CREATE POLICY "Enable delete for all users" ON public.calls FOR DELETE USING (true);
  END IF;
END $$;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================
-- Run these to verify the changes:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clients';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'calls';
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
