import { NextRequest, NextResponse } from 'next/server';
import { getCalendarClient, getClientIdFromToken } from '@/lib/googleCalendar';

export async function POST(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
        return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 });
    }

    const clientId = await getClientIdFromToken(token);
    if (!clientId) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    try {
        const body = await req.json();
        const args = body.args || {};

        const dateFrom = args.date_from;
        const dateTo = args.date_to || dateFrom;

        if (!dateFrom) {
            return NextResponse.json({
                result: 'Error: necesito al menos una fecha para consultar la agenda. Pregunta al usuario qué día quiere consultar.',
            });
        }

        const { calendar, calendarId } = await getCalendarClient(clientId);

        // Set time range for the query
        const timeMin = new Date(`${dateFrom}T00:00:00`).toISOString();
        const timeMax = new Date(`${dateTo}T23:59:59`).toISOString();

        const response = await calendar.events.list({
            calendarId,
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 20,
        });

        const events = response.data.items || [];

        if (events.length === 0) {
            return NextResponse.json({
                result: `No hay citas programadas entre ${dateFrom} y ${dateTo}. El horario está completamente disponible.`,
            });
        }

        const eventList = events.map((event) => {
            const start = event.start?.dateTime || event.start?.date || '';
            const end = event.end?.dateTime || event.end?.date || '';
            const startTime = start.includes('T') ? start.split('T')[1]?.substring(0, 5) : 'Todo el día';
            const endTime = end.includes('T') ? end.split('T')[1]?.substring(0, 5) : '';
            return `- ${startTime}${endTime ? ` a ${endTime}` : ''}: ${event.summary || 'Sin título'}${event.description ? ` (${event.description})` : ''}`;
        }).join('\n');

        return NextResponse.json({
            result: `Citas encontradas entre ${dateFrom} y ${dateTo}:\n${eventList}\n\nTotal: ${events.length} citas.`,
        });
    } catch (error: any) {
        console.error('Error listing events:', error);
        return NextResponse.json({
            result: 'Hubo un error al consultar la agenda. Por favor, inténtalo de nuevo más tarde.',
        });
    }
}
