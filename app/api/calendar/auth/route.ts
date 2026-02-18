import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/googleCalendar';

export async function GET(req: NextRequest) {
    const clientId = req.nextUrl.searchParams.get('client_id');

    if (!clientId) {
        return NextResponse.json({ error: 'client_id es requerido' }, { status: 400 });
    }

    const authUrl = getAuthUrl(clientId);
    return NextResponse.redirect(authUrl);
}
