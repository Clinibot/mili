import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protect Admin Routes
    // Protected: / (home), /clients/*
    // Public: /login, /portal/*, /api/webhooks/*, /_next/*, /static/*

    const path = request.nextUrl.pathname;

    const isProtectedAdminRoute = path === '/' || path.startsWith('/clients');
    const isLoginPage = path === '/login';
    const isPortalRoute = path.startsWith('/portal');
    const isPortalLoginPage = path === '/portal/login';

    // 1. Admin Protection
    if (isProtectedAdminRoute && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (isLoginPage && user) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 2. Portal Protection
    if (isPortalRoute) {
        const portalSession = request.cookies.get('portal-session');

        if (isPortalLoginPage && portalSession) {
            // Already logged in, redirect to a default portal page or use a saved slug if possible
            // For now, if we have a session, we let them through to /portal/login which should redirect
            // via client-side or just stay there. Better: redirect to a generic portal landing if we knew the slug.
            // Since we don't know the slug here easily without a DB lookup, 
            // we'll handle the "auto-redirect" inside the LoginPage itself for better UX.
        }

        if (!isPortalLoginPage && !portalSession) {
            return NextResponse.redirect(new URL('/portal/login', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/webhooks (public webhooks)
         * - portal (public client portal - has its own login check if needed)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)',
    ],
}
