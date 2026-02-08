const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')  // Remove all non-word chars
        .replace(/--+/g, '-');    // Replace multiple - with single -
}

async function runMigration() {
    console.log('Starting migration...');

    // 1. Add slug column if it doesn't exist
    // Since we don't have a direct SQL executor, we'll try to update a test record 
    // or assume we need to use a Supabase Edge Function or SQL Editor if we had access.
    // However, I can try to use RPC if a relevant one exists, but likely not.
    // Assuming I can't run ALTER TABLE directly from JS client without an RPC.

    console.log('Please run this SQL in your Supabase SQL Editor:');
    console.log('ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS slug text UNIQUE;');

    // 2. We will actually generate slugs for existing clients if the column is added.
    // I'll wait for the user to confirm they ran the SQL or try to proceed if I can find a way.
}

async function populateSlugs() {
    const { data: clients, error } = await supabase.from('clients').select('id, name');
    if (error) {
        console.error('Error fetching clients:', error);
        return;
    }

    for (const client of clients) {
        const slug = slugify(client.name);
        console.log(`Setting slug for ${client.name} to ${slug}`);
        const { error: updateError } = await supabase
            .from('clients')
            .update({ slug })
            .eq('id', client.id);

        if (updateError) {
            console.error(`Error updating slug for ${client.name}:`, updateError);
        }
    }
}

// Check if slug column exists first
async function checkSlugColumn() {
    const { data, error } = await supabase.from('clients').select('slug').limit(1);
    if (error && error.message.includes('column "slug" does not exist')) {
        console.log('COLUMN_MISSING');
    } else {
        console.log('COLUMN_EXISTS');
    }
}

if (process.argv[2] === 'populate') {
    populateSlugs();
} else {
    checkSlugColumn();
}
