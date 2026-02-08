const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Clubseomola1!@db.fhjmyjxqcaahrepdgtly.supabase.co:5432/postgres';

const client = new Client({
    connectionString: connectionString,
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to Supabase Postgres...');

        const queries = [
            `CREATE POLICY "Enable delete for all users" ON public.clients FOR DELETE USING (true);`,
            `CREATE POLICY "Enable delete for all users" ON public.agents FOR DELETE USING (true);`,
            `CREATE POLICY "Enable delete for all users" ON public.invoices FOR DELETE USING (true);`,
            // Add for calls if table exists
            `DO $$ 
       BEGIN 
         IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calls') THEN
           CREATE POLICY "Enable delete for all users" ON public.calls FOR DELETE USING (true);
         END IF; 
       END $$;`
        ];

        for (const sql of queries) {
            try {
                await client.query(sql);
                console.log(`Executed: ${sql.substring(0, 50)}...`);
            } catch (e) {
                // Ignore if policy already exists
                if (e.code === '42710') {
                    console.log('Policy already exists, skipping.');
                } else {
                    console.error('Error executing query:', e.message);
                }
            }
        }

        console.log('Added DELETE policies successfully!');

    } catch (err) {
        console.error('Error applying migration:', err);
    } finally {
        await client.end();
    }
}

runMigration();
