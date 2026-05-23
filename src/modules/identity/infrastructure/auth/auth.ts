import NextAuth from 'next-auth';

import { authConfig } from './auth.config';

/**
 * Inicializa o Auth.js.
 *
 * Responsabilidades deste arquivo:
 * - criar handlers HTTP;
 * - disponibilizar helpers de sessão;
 * - integrar middleware;
 * - centralizar acesso ao auth().
 *
 * Impacto arquitetural:
 *
 * Este arquivo se torna a camada pública da autenticação.
 * O restante do sistema NÃO deve importar NextAuth diretamente.
 * Deve sempre consumir:
 * - auth
 * - signIn
 * - signOut
 *
 * a partir deste módulo.
 */
export const {
    handlers,
    auth,
    signIn,
    signOut
} = NextAuth(authConfig);