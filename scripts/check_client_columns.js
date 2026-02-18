const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching clients:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Client columns:', Object.keys(data[0]));
        console.log('Sample client:', {
            id: data[0].id,
            api_key_retail: data[0].api_key_retail ? '***' : 'undefined',
            api_key_retell: data[0].api_key_retell ? '***' : 'undefined'
        });
    } else {
        console.log('No clients found');
    }
}

checkColumns();
