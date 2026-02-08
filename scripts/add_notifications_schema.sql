-- ================================================================
-- NOTIFICATIONS & ALERTS SYSTEM
-- Execute this in Supabase SQL Editor
-- ================================================================

-- 1. CREATE NOTIFICATIONS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL, -- 'invoice', 'low_balance', 'system', 'call_alert'
  title text NOT NULL,
  message text,
  read boolean DEFAULT false,
  metadata jsonb
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.notifications FOR DELETE USING (true);

-- 2. ADD NOTIFICATION PREFERENCES TO CLIENTS
-- ================================================================
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{
  "email_on_low_balance": true,
  "low_balance_threshold": 50,
  "email_on_invoice": true,
  "email_on_call_failure": false
}'::jsonb;

-- 3. INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_notifications_client_id ON public.notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
