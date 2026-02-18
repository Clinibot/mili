import { NextRequest, NextResponse } from 'next/server';
import { registerCalendarToolsOnAgent } from '@/lib/googleCalendar';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
    try {
        const { client_id } = await req.json();

        if (!client_id) {
            return NextResponse.json({ error: 'client_id is required' }, { status: 400 });
        }

        // Verify client exists
        const { data: client, error } = await supabase
            .from('clients')
            .select('id, name')
            .eq('id', client_id)
            .single();

        if (error || !client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        console.log(`Manually triggering tool registration for client: ${client.name} (${client.id})`);

        await registerCalendarToolsOnAgent(client.id);

        return NextResponse.json({ success: true, message: 'Tools registered successfully' });
    } catch (error: any) {
        console.error('Error registering tools:', error);
        return NextResponse.json({ error: error.message || 'Failed to register tools' }, { status: 500 });
    }
}
