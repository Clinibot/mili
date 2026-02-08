const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Clubseomola1!@db.fhjmyjxqcaahrepdgtly.supabase.co:5432/postgres';

const client = new Client({
    connectionString: connectionString,
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to Supabase Postgres...');

        const createTableSql = `
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

      -- Enable RLS
      ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

      -- Create Policy (Allow all for now, assuming service role or authenticated admin/client)
      CREATE POLICY "Enable read access for all users" ON public.calls FOR SELECT USING (true);
      CREATE POLICY "Enable insert for all users" ON public.calls FOR INSERT WITH CHECK (true);
    `;

        await client.query(createTableSql);
        console.log('Created calls table successfully!');

    } catch (err) {
        console.error('Error applying migration:', err);
    } finally {
        await client.end();
    }
}

runMigration();
