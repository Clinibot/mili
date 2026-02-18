import { NextRequest, NextResponse } from 'next/server';
import { getCalendarClient } from '@/lib/googleCalendar';

export async function GET(req: NextRequest) {
    const clientId = req.nextUrl.searchParams.get('client_id');

    if (!clientId) {
        return NextResponse.json({ error: 'client_id is required' }, { status: 400 });
    }

    try {
        const { calendar } = await getCalendarClient(clientId);

        const response = await calendar.calendarList.list();

        // Map to a simpler format for the UI
        const calendars = (response.data.items || []).map(cal => ({
            id: cal.id,
            summary: cal.summary,
            description: cal.description,
            primary: cal.primary || false,
            backgroundColor: cal.backgroundColor,
            foregroundColor: cal.foregroundColor
        }));

        return NextResponse.json({ calendars });
    } catch (error: any) {
        console.error('Error listing calendars for UI:', error);
        return NextResponse.json({ error: 'Failed to fetch calendar list' }, { status: 500 });
    }
}
