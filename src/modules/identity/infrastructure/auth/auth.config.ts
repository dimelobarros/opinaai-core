import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

/**
 * Configuração central do Auth.js.
 *
 * Responsabilidades:
 * - definir estratégia de autenticação;
 * - configurar providers;
 * - configurar sessão JWT;
 * - preparar callbacks futuros;
 * - centralizar comportamento de autenticação.
 *
 * Impacto arquitetural:
 *
 * Este arquivo se torna o núcleo da autenticação.
 * Todas as futuras estratégias de login devem ser adicionadas aqui.
 *
 * Exemplo futuro:
 * - Google OAuth
 * - Microsoft OAuth
 * - SSO
 * - Magic Link
 * - ...
 */
export const authConfig: NextAuthConfig = {
    providers: [
        Credentials({
            name: 'credentials',

            credentials: {
                email: {
                    label: 'E-mail',
                    type: 'email'
                },

                password: {
                    label: 'Senha',
                    type: 'password'
                }
            },

            /**
             * OBS:
             * O authorize ainda NÃO será implementado!
             * Estou preparando toda parte da infraestrutura primeiro.
             * A lógica real será implementada quando estiver sendo tratado o Backend.
             */
            async authorize() {
                return null;
            }
        })
    ],

    session: {
        strategy: 'jwt'
    },

    pages: {
        signIn: '/login'
    },

    secret: process.env.AUTH_SECRET
};