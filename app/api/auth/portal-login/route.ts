import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const { email, password } = await request.json()

    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.set({ name, value: '', ...options })
                },
            },
        }
    )

    // Verify client credentials
    const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('portal_user', email)
        .eq('portal_password', password)
        .single()

    if (error || !client) {
        return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    // Set a custom cookie for portal access
    // For simplicity, we store the client ID in a cookie
    // In production, this should be a signed JWT
    cookieStore.set('portal-session', client.id, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    const redirectUrl = `/portal/${(client as any).slug || client.id}`;

    return NextResponse.json({
        success: true,
        client: { id: client.id, name: client.name, slug: (client as any).slug },
        redirectUrl
    })
}
