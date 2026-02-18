import { NextRequest, NextResponse } from 'next/server';
import { removeCalendarToolsFromAgent } from '@/lib/googleCalendar';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { client_id } = body;

        if (!client_id) {
            return NextResponse.json({ error: 'client_id es requerido' }, { status: 400 });
        }

        // 1. Remove calendar tools from the Retell agent
        try {
            await removeCalendarToolsFromAgent(client_id);
        } catch (err) {
            console.error('Error removing tools from Retell:', err);
        }

        // 2. Delete tokens from DB
        await supabase
            .from('google_calendar_tokens')
            .delete()
            .eq('client_id', client_id);

        // 3. Mark client as disconnected
        await supabase
            .from('clients')
            .update({ calendar_connected: false })
            .eq('id', client_id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error disconnecting calendar:', error);
        return NextResponse.json({ error: 'Error al desconectar' }, { status: 500 });
    }
}
