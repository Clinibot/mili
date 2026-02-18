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

        const { summary, date, start_time, end_time, description, attendee_name, attendee_phone } = args;

        if (!summary || !date || !start_time || !end_time) {
            return NextResponse.json({
                result: 'Error: necesito el título de la cita, fecha, hora de inicio y hora de fin. Pregunta estos datos al usuario.',
            });
        }

        const { calendar, calendarId } = await getCalendarClient(clientId);

        const startDateTime = `${date}T${start_time}:00`;
        const endDateTime = `${date}T${end_time}:00`;

        // Build description with attendee info
        let fullDescription = description || '';
        if (attendee_name) fullDescription += `\nCliente: ${attendee_name}`;
        if (attendee_phone) fullDescription += `\nTeléfono: ${attendee_phone}`;

        const event = {
            summary,
            description: fullDescription.trim(),
            start: {
                dateTime: startDateTime,
                timeZone: 'Europe/Madrid',
            },
            end: {
                dateTime: endDateTime,
                timeZone: 'Europe/Madrid',
            },
        };

        const response = await calendar.events.insert({
            calendarId,
            requestBody: event,
        });

        return NextResponse.json({
            result: `Cita agendada correctamente: "${summary}" el ${date} de ${start_time} a ${end_time}.${attendee_name ? ` Cliente: ${attendee_name}.` : ''} ID de la cita: ${response.data.id}`,
        });
    } catch (error: any) {
        console.error('Error creating event:', error);
        return NextResponse.json({
            result: 'Hubo un error al agendar la cita. Por favor, inténtalo de nuevo más tarde.',
        });
    }
}
