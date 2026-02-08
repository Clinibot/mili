const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('--- Checking INVOICES table ---');
    const { data: invoices, error } = await supabase.from('invoices').select('*').limit(1);
    if (error) {
        console.error('Error fetching invoices schema:', error);
        return;
    }
    console.log('Columns in invoices table:', Object.keys(invoices[0] || {}));

    console.log('\n--- Checking CLIENTS table ---');
    const { data: clients, error: clientError } = await supabase.from('clients').select('*').limit(1);
    if (clientError) {
        console.error('Error fetching clients schema:', clientError);
        return;
    }
    console.log('Columns in clients table:', Object.keys(clients[0] || {}));
}

checkSchema();
