export { auth as middleware } from '@/modules/identity/infrastructure/auth/auth';

/**
 * Matcher global do middleware.
 *
 * Agora, ainda NÃO dá para proteger rotas, mas dá para preparar a infraestrutura
 * A lógica real será adicionada posteriormente.
 */
export const config = {
    matcher: [
        '/admin/:path*'
    ]
};