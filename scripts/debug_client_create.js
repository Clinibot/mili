
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fhjmyjxqcaahrepdgtly.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoam15anhxY2FhaHJlcGRndGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDM1MTcsImV4cCI6MjA4NjExOTUxN30.X3IW_3gLpiyHrTr-s0_Ga5VyTvYmgMlF1d231f_kJho';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateClient() {
    console.log('Testing client creation with extra contacts...');

    const timestamp = Date.now();
    const testClient = {
        name: `Test Client ${timestamp}`,
        slug: `test-client-${timestamp}`,
        webhook_token: `token-${timestamp}`,
        status: 'Cita programada',
        // Optional fields set to null as per sanitizeClientPayload
        portal_user: null,
        portal_password: null,
        budget_template_url: null,
        notes: "Test notes"
    };

    try {
        // 1. Insert Client
        console.log('Inserting client...');
        const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .insert([testClient])
            .select()
            .single();

        if (clientError) {
            console.error('Error inserting client:', clientError);
            return;
        }
        console.log('Client created successfully:', clientData.id);

        // 2. Insert Contact
        const testContact = {
            client_id: clientData.id,
            name: 'Test Contact',
            role: 'Tester',
            email: 'test@example.com',
            phone: '123456789'
        };

        console.log('Inserting contact...');
        const { data: contactData, error: contactError } = await supabase
            .from('client_contacts')
            .upsert([testContact])
            .select();

        if (contactError) {
            console.error('Error inserting contact:', contactError);
        } else {
            console.log('Contact inserted successfully:', contactData);
        }

        // Cleanup
        console.log('Cleaning up...');
        await supabase.from('client_contacts').delete().eq('client_id', clientData.id);
        await supabase.from('clients').delete().eq('id', clientData.id);
        console.log('Cleanup done.');

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testCreateClient();
