
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fhjmyjxqcaahrepdgtly.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoam15anhxY2FhaHJlcGRndGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDM1MTcsImV4cCI6MjA4NjExOTUxN30.X3IW_3gLpiyHrTr-s0_Ga5VyTvYmgMlF1d231f_kJho';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestClient() {
    console.log('Fetching latest clients...');

    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching clients:', error);
        return;
    }

    console.log('Latest 5 clients:');
    data.forEach(c => {
        console.log(`- [${c.created_at}] ID: ${c.id} | Name: ${c.name} | Status: ${c.status}`);
    });
}

checkLatestClient();
