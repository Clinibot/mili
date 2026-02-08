const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Clubseomola1!@db.fhjmyjxqcaahrepdgtly.supabase.co:5432/postgres';

const client = new Client({
    connectionString: connectionString,
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to Supabase Postgres...');

        // Add webhook_token column to clients if it doesn't exist
        const checkColumnSql = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='clients' AND column_name='webhook_token';
    `;
        const res = await client.query(checkColumnSql);

        if (res.rows.length === 0) {
            const sql = `
          ALTER TABLE public.clients ADD COLUMN webhook_token text;
          CREATE INDEX idx_clients_webhook_token ON public.clients(webhook_token);
        `;
            await client.query(sql);
            console.log('Added webhook_token column to clients table successfully!');
        } else {
            console.log('webhook_token column already exists.');
        }

    } catch (err) {
        console.error('Error applying migration:', err);
    } finally {
        await client.end();
    }
}

runMigration();
