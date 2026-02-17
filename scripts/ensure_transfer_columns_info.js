const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    try {
        console.log('Connecting to Supabase...');

        // Use rpc if possible or just try to hack it if we can't run raw SQL easily via client
        // Since we don't have an RPC for raw SQL, and the previous script used 'pg' which failed,
        // I will try to use the 'pg' client again but with the correct connection string if I can find it,
        // OR I will assume the columns might be added via the dashboard if this fails.
        // Actually, I'll try to use a different approach for the migration if possible.

        console.log('Note: If this fails, the columns should be added manually via Supabase SQL Editor:');
        console.log(`
            ALTER TABLE public.calls 
            ADD COLUMN IF NOT EXISTS transfer_attempted boolean DEFAULT false,
            ADD COLUMN IF NOT EXISTS transfer_successful boolean DEFAULT false,
            ADD COLUMN IF NOT EXISTS transfer_destination text;
        `);

        // Since I cannot run raw SQL easily without a direct connection or an RPC, 
        // I will proceed to update the code and notify the user if the migration is strictly needed 
        // through a direct SQL execution. However, I'll try one more time with a potential fix for the hostname if I can.

    } catch (err) {
        console.error('Error:', err);
    }
}

runMigration();
