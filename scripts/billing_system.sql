-- ================================================================
-- RECURRING MAINTENANCE BILLING SYSTEM (30 DAYS)
-- ================================================================

-- 1. ADD TRACKING COLUMN TO CLIENTS
-- ================================================================
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_maintenance_billing timestamp with time zone;

-- Initialize last_maintenance_billing for existing subscribers to prevent double-charging immediately
UPDATE public.clients 
SET last_maintenance_billing = created_at 
WHERE subscription_tier = 'monthly' AND last_maintenance_billing IS NULL;

-- 2. CREATE BILLING PROCESS FUNCTION
-- ================================================================
CREATE OR REPLACE FUNCTION public.process_maintenance_billing()
RETURNS void AS $$
DECLARE
    client_record RECORD;
    maintenance_fee constant numeric := 55;
BEGIN
    -- Iterate over clients with active monthly subscriptions whose last billing was > 30 days ago
    FOR client_record IN 
        SELECT id, balance, name 
        FROM public.clients 
        WHERE subscription_tier = 'monthly'
        AND (last_maintenance_billing IS NULL OR last_maintenance_billing <= now() - interval '30 days')
    LOOP
        -- 1. Deduct 55€ from balance
        UPDATE public.clients 
        SET balance = balance - maintenance_fee,
            last_maintenance_billing = now()
        WHERE id = client_record.id;

        -- 2. Log in transactions
        INSERT INTO public.transactions (
            client_id,
            type,
            amount,
            balance_before,
            balance_after,
            description,
            metadata
        ) VALUES (
            client_record.id,
            'deduction',
            maintenance_fee,
            client_record.balance,
            client_record.balance - maintenance_fee,
            'Cuota mensual de mantenimiento (30 días)',
            jsonb_build_object('billing_cycle', 'monthly', 'fee_type', 'maintenance')
        );

        RAISE NOTICE 'Deducted 55€ from client % (%)', client_record.name, client_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. (OPTIONAL) AUTOMATE VIA PG_CRON
-- ================================================================
-- If you have pg_cron enabled in Supabase, run:
-- SELECT cron.schedule('process-maintenance-billing-daily', '0 0 * * *', 'SELECT process_maintenance_billing()');
