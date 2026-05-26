export { auth as middleware } from '@/modules/identity/infrastructure/auth/auth';

/**
 * Middleware global da aplicação.
 *
 * Responsabilidades:
 * - proteger rotas administrativas;
 * - validar sessão;
 * - impedir acesso não autenticado.
 */

export const config = {
    matcher: ['/admin/:path*']
};
