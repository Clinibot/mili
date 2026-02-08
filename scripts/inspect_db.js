const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testColumns(tableName) {
    const columnsToTest = ['client_id', 'type', 'amount', 'status', 'invoice_date', 'date', 'description'];
    console.log(`\n--- Testing columns in ${tableName} ---`);

    for (const col of columnsToTest) {
        const { error } = await supabase.from(tableName).select(col).limit(1);
        if (error) {
            console.log(`❌ Column '${col}' seems MISSING: ${error.message}`);
        } else {
            console.log(`✅ Column '${col}' EXISTS`);
        }
    }
}

testColumns('invoices');

async function inspectTable(tableName) {
    console.log(`\n--- Inspecting table: ${tableName} ---`);
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: tableName });

    if (error) {
        // Fallback to direct SQL if RPC doesn't exist
        console.log('RPC failed, trying raw query via REST (might fail if not exposed)...');
        // Since we can't do arbitrary SQL via REST easily without RPC, 
        // let's try to just select 1 row and check the error message or row keys
        const { data: rows, error: selectError } = await supabase.from(tableName).select('*').limit(1);
        if (selectError) {
            console.error(`Error selecting from ${tableName}:`, selectError);
        } else if (rows && rows.length > 0) {
            console.log(`Columns in ${tableName}:`, Object.keys(rows[0]));
        } else {
            console.log(`Table ${tableName} is empty, columns cannot be determined via select *`);
        }
    } else {
        console.log(`Columns in ${tableName}:`, data);
    }
}

// Since we might not have the RPC, let's try a trick: insert an empty object and see the error
async function forceError(tableName) {
    console.log(`\n--- Forcing error on table: ${tableName} ---`);
    const { error } = await supabase.from(tableName).insert({ non_existent_column_test: 1 });
    console.log('Insert error message (contains info about table?):', error?.message);
}

inspectTable('invoices');
forceError('invoices');
inspectTable('clients');
