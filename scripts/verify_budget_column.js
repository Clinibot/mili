
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyColumn() {
    console.log('Verifying budget_template_url column in clients table...');

    // Try to select the column
    const { data, error } = await supabase
        .from('clients')
        .select('budget_template_url')
        .limit(1);

    if (error) {
        console.error('Error selecting column:', error.message);
        if (error.message.includes('does not exist')) {
            console.error('Column budget_template_url likely does not exist.');
        }
    } else {
        console.log('Success! Column budget_template_url exists.');
    }
}

verifyColumn();
