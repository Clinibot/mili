
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateClient() {
    // Simulate what happens when name is empty
    const newClient = {
        name: '',
        status: 'Cliente',
        phone_ia: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        cost_per_minute: 0,
        api_key_retail: '',
        agent_id: '',
        workspace_name: '',
        webhook_token: randomUUID(),
        portal_user: '',
        portal_password: '',
        slug: '', // slugify('') -> ''
        balance: 0
    };

    console.log('Attempting to insert client with empty name/slug:', newClient);

    const { data, error } = await supabase
        .from('clients')
        .insert([newClient])
        .select();

    if (error) {
        console.error('Error inserting client:', error);
    } else {
        console.log('Success! Client created:', data);
        // Cleanup
        await supabase.from('clients').delete().eq('id', data[0].id);
    }
}

testCreateClient();
