import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode, registerCalendarToolsOnAgent } from '@/lib/googleCalendar';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code');
    const clientId = req.nextUrl.searchParams.get('state'); // We passed client_id as state

    if (!code || !clientId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/portal/login?error=missing_params`);
    }

    try {
        // 1. Exchange auth code for tokens
        const tokens = await getTokensFromCode(code);

        if (!tokens.access_token || !tokens.refresh_token) {
            throw new Error('No se recibieron tokens completos de Google');
        }

        // 2. Save tokens in Supabase
        const { error: upsertError } = await supabase
            .from('google_calendar_tokens')
            .upsert({
                client_id: clientId,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                token_expiry: new Date(tokens.expiry_date || Date.now() + 3600000).toISOString(),
                calendar_id: 'primary',
                connected_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'client_id',
            });

        if (upsertError) {
            console.error('Error saving tokens:', upsertError);
            throw new Error('Error al guardar tokens');
        }

        // 3. Register 4 calendar tools on the client's Retell agent
        try {
            await registerCalendarToolsOnAgent(clientId);
        } catch (toolError) {
            console.error('Error registering tools on Retell:', toolError);
            // Don't fail the whole flow — tokens are saved, tools can be retried
        }

        // 4. Mark client as calendar_connected
        await supabase
            .from('clients')
            .update({ calendar_connected: true })
            .eq('id', clientId);

        // 5. Redirect back to the portal calendar page
        // Find the client's slug for the redirect
        const { data: clientData } = await supabase
            .from('clients')
            .select('slug')
            .eq('id', clientId)
            .single();

        const slug = clientData?.slug || '';
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/portal/${slug}/calendar?connected=true`);
    } catch (error: any) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/portal/login?error=oauth_failed`);
    }
}
