// Script to seed users. Run with: node scripts/seed_users.js
// Note: This uses the public Supabase client. 
// Ideally, use Service Role key for admin actions, but we'll try public signUp first.

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' }); // Load env vars if available

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fhjmyjxqcaahrepdgtly.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here';

const supabase = createClient(supabaseUrl, supabaseKey);

const users = [
    { email: 'mili@mili.com', password: 'mili@mili.com' },
    { email: 'sonia@sonia.com', password: 'sonia@sonia.com' }
];

async function seedUsers() {
    console.log('Seeding users...');

    for (const user of users) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: user.email,
                password: user.password,
            });

            if (error) throw error;

            console.log(`Created/Checked user: ${user.email}`);
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                console.log(`User ${user.email} might already exist.`);
            }

        } catch (err) {
            console.error(`Error creating ${user.email}:`, err.message);
        }
    }
}

seedUsers();
