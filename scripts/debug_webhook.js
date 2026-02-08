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

async function debug() {
    const token = '88def592-aa43-458f-afcb-d8674a508ede';

    console.log(`Checking client for token: ${token}`);
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('webhook_token', token)
        .single();

    if (clientError || !client) {
        console.error('Client not found:', clientError);
        return;
    }

    console.log('--- CLIENT ---');
    console.log(`ID: ${client.id}`);
    console.log(`Name: ${client.name}`);
    console.log(`Slug: ${client.slug}`);
    console.log(`Balance: ${client.balance}`);

    console.log('\n--- TRANSACTIONS (last 5) ---');
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(5);
    console.table(transactions);

    console.log('\n--- CALLS (last 5) ---');
    const { data: calls } = await supabase
        .from('calls')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(5);
    console.table(calls);
}

debug();
