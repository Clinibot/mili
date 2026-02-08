const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Clubseomola1!@db.fhjmyjxqcaahrepdgtly.supabase.co:5432/postgres';

const client = new Client({
    connectionString: connectionString,
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to Supabase Postgres...');

        // Add portal_user and portal_password columns to clients if they don't exist
        const queries = [
            `ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS portal_user text;`,
            `ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS portal_password text;`,
            // Add unique constraint to portal_user to prevent duplicates
            `CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_portal_user ON public.clients(portal_user);`
        ];

        for (const sql of queries) {
            await client.query(sql);
        }

        console.log('Added portal_user and portal_password columns successfully!');

    } catch (err) {
        console.error('Error applying migration:', err);
    } finally {
        await client.end();
    }
}

runMigration();
