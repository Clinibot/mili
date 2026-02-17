const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Clubseomola1!@db.fhjmyjxqcaahrepdgtly.supabase.co:5432/postgres';

const client = new Client({
    connectionString: connectionString,
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to Supabase Postgres...');

        const sql = `
            CREATE TABLE IF NOT EXISTS public.client_analytics_configs (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
                client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
                name text NOT NULL,
                type text NOT NULL CHECK (type IN ('kpi', 'chart')),
                chart_type text CHECK (chart_type IN ('bar', 'area', 'pie', 'line')),
                data_field text NOT NULL, -- The key in custom_analysis_data
                calculation text NOT NULL CHECK (calculation IN ('count', 'sum', 'avg', 'percentage')),
                color text,
                icon text,
                is_active boolean DEFAULT true
            );

            -- Enable RLS
            ALTER TABLE public.client_analytics_configs ENABLE ROW LEVEL SECURITY;

            -- Policy for analytics configs
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies 
                    WHERE tablename = 'client_analytics_configs' 
                    AND policyname = 'Enable access for all'
                ) THEN
                    CREATE POLICY "Enable access for all" ON public.client_analytics_configs FOR ALL USING (true);
                END IF;
            END $$;
        `;

        await client.query(sql);
        console.log('Created client_analytics_configs table successfully!');

    } catch (err) {
        console.error('Error applying migration:', err);
    } finally {
        await client.end();
    }
}

runMigration();
