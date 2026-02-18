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

        const { attendee_name, original_date, new_date, new_start_time, new_end_time } = args;

        if (!attendee_name || !new_date || !new_start_time || !new_end_time) {
            return NextResponse.json({
                result: 'Error: necesito el nombre del cliente, nueva fecha, nueva hora de inicio y nueva hora de fin.',
            });
        }

        const { calendar, calendarId } = await getCalendarClient(clientId);

        // Search for the event by attendee name
        const searchDate = original_date || new_date;
        const timeMin = new Date(`${searchDate}T00:00:00`).toISOString();
        const timeMax = new Date(`${searchDate}T23:59:59`).toISOString();

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
                result: `No se encontró ninguna cita con "${attendee_name}" el ${searchDate}. Verifica el nombre y la fecha con el usuario.`,
            });
        }

        // Use the first matching event
        const targetEvent = events[0];

        const updatedEvent = {
            ...targetEvent,
            start: {
                dateTime: `${new_date}T${new_start_time}:00`,
                timeZone: 'Europe/Madrid',
            },
            end: {
                dateTime: `${new_date}T${new_end_time}:00`,
                timeZone: 'Europe/Madrid',
            },
        };

        await calendar.events.update({
            calendarId,
            eventId: targetEvent.id!,
            requestBody: updatedEvent,
        });

        return NextResponse.json({
            result: `Cita reagendada correctamente. "${targetEvent.summary}" ahora es el ${new_date} de ${new_start_time} a ${new_end_time}.`,
        });
    } catch (error: any) {
        console.error('Error updating event:', error);
        return NextResponse.json({
            result: 'Hubo un error al reagendar la cita. Por favor, inténtalo de nuevo más tarde.',
        });
    }
}
