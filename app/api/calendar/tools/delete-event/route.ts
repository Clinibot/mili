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

        const { user_phone, date } = args;

        if (!user_phone) {
            return NextResponse.json({
                result: 'Error: necesito el teléfono del usuario para buscar su cita.',
            });
        }

        const { calendar, calendarId } = await getCalendarClient(clientId);

        // Determine search range
        let timeMin: string;
        let timeMax: string;

        if (date) {
            // Search on the specific date
            timeMin = new Date(`${date}T00:00:00`).toISOString();
            timeMax = new Date(`${date}T23:59:59`).toISOString();
        } else {
            // Search next 30 days if no date given
            const now = new Date();
            timeMin = now.toISOString();
            const futureDate = new Date(now);
            futureDate.setDate(futureDate.getDate() + 30);
            timeMax = futureDate.toISOString();
        }

        // Get all events in the range
        const listResponse = await calendar.events.list({
            calendarId,
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 50,
        });

        const events = listResponse.data.items || [];

        // Search for events that contain the user's phone number
        // The phone could be in description, summary, or attendee info
        const normalizePhone = (phone: string) => phone.replace(/[\s\-\(\)\+]/g, '');
        const normalizedUserPhone = normalizePhone(user_phone);

        const matchingEvents = events.filter(event => {
            const desc = event.description || '';
            const summary = event.summary || '';
            const allText = `${desc} ${summary}`;

            // Normalize all phone-like patterns in the text
            const normalizedText = normalizePhone(allText);

            // Check if the user's phone appears in event text
            // Try matching last 9 digits (Spanish phone without country code)
            const last9 = normalizedUserPhone.slice(-9);
            return normalizedText.includes(last9);
        });

        if (matchingEvents.length === 0) {
            const dateMsg = date ? ` el ${date}` : ' en los próximos 30 días';
            return NextResponse.json({
                result: `No se encontró ninguna cita asociada al teléfono ${user_phone}${dateMsg}. El usuario podría haber reservado con otro número de teléfono.`,
            });
        }

        // If multiple matches, list them and delete the soonest one
        if (matchingEvents.length > 1) {
            // Delete the nearest future event
            const targetEvent = matchingEvents[0]; // Already sorted by startTime

            await calendar.events.delete({
                calendarId,
                eventId: targetEvent.id!,
            });

            const start = targetEvent.start?.dateTime || targetEvent.start?.date || '';
            const startTime = start.includes('T') ? start.split('T')[1]?.substring(0, 5) : '';

            const otherEvents = matchingEvents.slice(1).map(e => {
                const s = e.start?.dateTime || e.start?.date || '';
                const st = s.includes('T') ? s.split('T')[1]?.substring(0, 5) : '';
                const d = s.split('T')[0];
                return `${d} a las ${st}: ${e.summary}`;
            }).join(', ');

            return NextResponse.json({
                result: `Se ha cancelado la cita más próxima: "${targetEvent.summary}" del ${start.split('T')[0]} a las ${startTime}. Nota: el usuario tiene otras citas: ${otherEvents}. Si quiere cancelar alguna de esas, debe indicarlo.`,
            });
        }

        // Single match - delete it
        const targetEvent = matchingEvents[0];

        await calendar.events.delete({
            calendarId,
            eventId: targetEvent.id!,
        });

        const start = targetEvent.start?.dateTime || targetEvent.start?.date || '';
        const startTime = start.includes('T') ? start.split('T')[1]?.substring(0, 5) : '';

        return NextResponse.json({
            result: `Cita cancelada correctamente: "${targetEvent.summary}" que estaba programada el ${start.split('T')[0]} a las ${startTime}.`,
        });
    } catch (error: any) {
        console.error('Error deleting event:', error);
        return NextResponse.json({
            result: 'Hubo un error al cancelar la cita. Por favor, inténtalo de nuevo más tarde.',
        });
    }
}
