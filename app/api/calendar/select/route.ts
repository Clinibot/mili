import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
    try {
        const { client_id, calendar_id } = await req.json();

        if (!client_id || !calendar_id) {
            return NextResponse.json({ error: 'client_id and calendar_id are required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('google_calendar_tokens')
            .update({
                calendar_id,
                updated_at: new Date().toISOString()
            })
            .eq('client_id', client_id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error selecting calendar:', error);
        return NextResponse.json({ error: 'Failed to update selected calendar' }, { status: 500 });
    }
}
