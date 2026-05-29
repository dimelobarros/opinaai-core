import { NextResponse } from 'next/server';

import { auth } from '@/modules/identity/infrastructure/auth/auth';

/**
 * Middleware global responsável
 * pela proteção da área administrativa.
 */
export default auth((req) => {
    const isAuthenticated = !!req.auth;

    const isAdminRoute =
        req.nextUrl.pathname.startsWith('/admin');

    /**
     * Bloqueia acesso sem login.
     */
    if (isAdminRoute && !isAuthenticated) {
        return NextResponse.redirect(
            new URL('/login', req.url),
        );
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/admin/:path*'],
};