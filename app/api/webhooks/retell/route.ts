import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 401 });
        }

        // Verify token exists (optional: cache this check for performance if high volume)
        const { data: client, error } = await supabase
            .from('clients')
            .select('id')
            .eq('webhook_token', token)
            .single();

        if (error || !client) {
            console.error('Invalid token:', token);
            return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
        }

        const body = await req.json();
        console.log('Webhook received for client:', client.id, body);

        // TODO: Process call data and insert into 'calls' table
        // This is a placeholder for future implementation as requested.

        return NextResponse.json({ received: true });

    } catch (e) {
        console.error('Webhook error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
