
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function inspectTable() {
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching clients:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns in clients table:', Object.keys(data[0]));
    } else {
        console.log('No data in clients table, checking information schema not possible easily with JS client alone without RPC.');
        // Fallback: try to insert a dummy with a non-existent column to see error, or just assume we need to add it.
        // Better: use RPC if available or just list keys from a row.
    }
}

inspectTable();
