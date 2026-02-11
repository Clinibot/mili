
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyColumn() {
    console.log('Verifying notes column existence...');
    // Try to select the 'notes' column from one record
    const { data, error } = await supabase
        .from('clients')
        .select('notes')
        .limit(1);

    if (error) {
        if (error.message && (error.message.includes('does not exist') || error.code === '42703')) {
            console.log('Verification FAILED: Column "notes" does not exist.');
            process.exit(1);
        } else {
            console.error('Verification Error:', error);
            // If it's another error (like permission), we can't be sure, but usually we can select if table is public
            // adhering to RLS policies.
            process.exit(2);
        }
    } else {
        console.log('Verification SUCCESS: Column "notes" exists.');
        process.exit(0);
    }
}

verifyColumn();
