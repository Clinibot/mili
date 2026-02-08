const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data: clients, error } = await supabase.from('clients').select('*').limit(1);
    if (error) {
        console.error('Error fetching clients:', error);
        return;
    }
    console.log('Columns in clients table:', Object.keys(clients[0] || {}));
}

checkSchema();
