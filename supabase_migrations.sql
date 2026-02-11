-- ================================================================
-- SUPABASE MIGRATIONS - IA PARA LLAMADAS
-- Execute this entire file in your Supabase SQL Editor
-- ================================================================

-- 1. ADD PORTAL CREDENTIALS, SLUG & BILLING TO CLIENTS TABLE
-- ================================================================
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS portal_user text UNIQUE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS portal_password text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS webhook_token text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'none';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS subscription_amount numeric DEFAULT 0;

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

-- 4. CREATE DOCUMENTATION_ITEMS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.documentation_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('url', 'file')),
  content text NOT NULL,
  file_name text,
  created_by text
);

-- Enable RLS
ALTER TABLE public.documentation_items ENABLE ROW LEVEL SECURITY;

-- Policies for documentation_items
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documentation_items' 
    AND policyname = 'Enable access for all'
  ) THEN
    CREATE POLICY "Enable access for all" ON public.documentation_items FOR ALL USING (true);
  END IF;
END $$;

-- 5. STORAGE BUCKET CONFIGURATION
-- ================================================================
-- Note: Bucket creation via SQL requires specific permissions.
-- If this fails in your editor, please create the 'documentation' bucket manually in the Storage UI.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentation', 'documentation', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for documentation bucket
-- UPDATED: Used specific names to avoid collision with other buckets
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Documentation Bucket Select' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Documentation Bucket Select" ON storage.objects FOR SELECT USING (bucket_id = 'documentation');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Documentation Bucket All Access' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Documentation Bucket All Access" ON storage.objects FOR ALL USING (bucket_id = 'documentation') WITH CHECK (bucket_id = 'documentation');
  END IF;
END $$;
