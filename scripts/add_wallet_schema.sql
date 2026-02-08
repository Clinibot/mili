-- ================================================================
-- WALLET & SUBSCRIPTION SYSTEM - DATABASE SCHEMA
-- ================================================================

-- 1. ADD WALLET FIELDS TO CLIENTS TABLE
-- ================================================================
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'none';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS subscription_amount numeric DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- 2. CREATE TRANSACTIONS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL, -- 'recharge', 'deduction', 'subscription'
  amount numeric NOT NULL,
  balance_before numeric,
  balance_after numeric,
  description text,
  stripe_payment_intent_id text,
  metadata jsonb
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.transactions FOR INSERT WITH CHECK (true);

-- 3. CREATE SUBSCRIPTIONS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text UNIQUE NOT NULL,
  status text NOT NULL, -- 'active', 'canceled', 'past_due'
  amount numeric NOT NULL,
  current_period_start bigint,
  current_period_end bigint,
  metadata jsonb
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.subscriptions FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.subscriptions FOR DELETE USING (true);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON public.transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_client_id ON public.subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_calls_client_id ON public.calls(client_id);
