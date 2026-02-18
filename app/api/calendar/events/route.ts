import { NextRequest, NextResponse } from 'next/server';
import { getCalendarClient } from '@/lib/googleCalendar';

export async function GET(req: NextRequest) {
    const clientId = req.nextUrl.searchParams.get('client_id');
    const timeMin = req.nextUrl.searchParams.get('timeMin');
    const timeMax = req.nextUrl.searchParams.get('timeMax');

    if (!clientId) {
        return NextResponse.json({ error: 'client_id is required' }, { status: 400 });
    }

    try {
        const { calendar, calendarId } = await getCalendarClient(clientId);

        const response = await calendar.events.list({
            calendarId,
            timeMin: timeMin || undefined,
            timeMax: timeMax || undefined,
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 100,
        });

        return NextResponse.json({ events: response.data.items || [] });
    } catch (error: any) {
        console.error('Error fetching events for UI:', error);
        return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
    }
}
