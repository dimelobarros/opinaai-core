import { NextResponse } from 'next/server';

import { auth } from '@/modules/identity/infrastructure/auth/auth';

/**
 * Middleware responsável por proteger
 * todas as rotas administrativas.
 *
 * Esta implementação mantém compatibilidade
 * com a estrutura atual do projeto.
 *
 * Não adicionamos RBAC aqui.
 *
 * O objetivo desta etapa é apenas garantir:
 * - autenticação válida;
 * - sessão carregada;
 * - acesso seguro ao admin.
 */
export default auth((req) => {
    const isAuthenticated = !!req.auth;

    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

    /**
     * Caso o usuário tente acessar
     * área administrativa sem sessão,
     * redireciona para login.
     */
    if (isAdminRoute && !isAuthenticated) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/admin/:path*']
};