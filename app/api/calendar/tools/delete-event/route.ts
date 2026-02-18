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

        const { attendee_name, date } = args;

        if (!attendee_name || !date) {
            return NextResponse.json({
                result: 'Error: necesito el nombre del cliente y la fecha de la cita a cancelar.',
            });
        }

        const { calendar, calendarId } = await getCalendarClient(clientId);

        // Search for the event
        const timeMin = new Date(`${date}T00:00:00`).toISOString();
        const timeMax = new Date(`${date}T23:59:59`).toISOString();

        const listResponse = await calendar.events.list({
            calendarId,
            timeMin,
            timeMax,
            singleEvents: true,
            q: attendee_name,
            maxResults: 5,
        });

        const events = listResponse.data.items || [];

        if (events.length === 0) {
            return NextResponse.json({
                result: `No se encontró ninguna cita con "${attendee_name}" el ${date}. Verifica el nombre y la fecha con el usuario.`,
            });
        }

        // Delete the first matching event
        const targetEvent = events[0];

        await calendar.events.delete({
            calendarId,
            eventId: targetEvent.id!,
        });

        return NextResponse.json({
            result: `Cita cancelada correctamente: "${targetEvent.summary}" que estaba programada el ${date}.`,
        });
    } catch (error: any) {
        console.error('Error deleting event:', error);
        return NextResponse.json({
            result: 'Hubo un error al cancelar la cita. Por favor, inténtalo de nuevo más tarde.',
        });
    }
}
