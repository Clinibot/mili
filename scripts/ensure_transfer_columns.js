const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Clubseomola1!@db.fhjmyjxqcaahrepdgtly.supabase.co:5432/postgres';

const client = new Client({
    connectionString: connectionString,
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to Supabase Postgres...');

        const sql = `
            ALTER TABLE public.calls 
            ADD COLUMN IF NOT EXISTS transfer_attempted boolean DEFAULT false,
            ADD COLUMN IF NOT EXISTS transfer_successful boolean DEFAULT false,
            ADD COLUMN IF NOT EXISTS transfer_destination text;
        `;

        await client.query(sql);
        console.log('Added transfer columns to calls table successfully!');

    } catch (err) {
        console.error('Error applying migration:', err);
    } finally {
        await client.end();
    }
}

runMigration();
