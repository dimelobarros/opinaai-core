import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { AuthenticateUserUseCase } from '../../application/authenticate-user.use-case';
import { loginSchema } from '../validations/login.schema';

/**
 * Configuração central do Auth.js.
 *
 * Responsabilidades:
 * - configurar providers;
 * - configurar autenticação;
 * - configurar sessão JWT;
 * - configurar callbacks;
 * - configurar páginas protegidas.
 *
 * Esta configuração foi simplificada para manter
 * compatibilidade com a arquitetura atual do SaaS.
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
       * Responsável por autenticar o usuário
       * utilizando e-mail e senha.
       */
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const useCase = new AuthenticateUserUseCase();

        let user = null;

        try {
          user = await useCase.execute(email, password);
        } catch (error) {
          console.error('Erro na autenticação:', error);

          return null;
        }

        if (!user) {
          return null;
        }

        /**
         * Objeto retornado para o JWT.
         *
         * IMPORTANTE:
         * Apenas dados necessários devem ser expostos.
         */
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    })
  ],

  /**
   * Estratégia JWT simplificada.
   *
   * Mantém o sistema stateless
   * e reduz complexidade.
   */
  session: {
    strategy: 'jwt'
  },

  /**
   * Página customizada de login.
   */
  pages: {
    signIn: '/login'
  },

  callbacks: {
    /**
     * Callback executado na geração do JWT.
     *
     * Responsável por persistir dados
     * adicionais da sessão.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as string;
      }

      return token;
    },

    /**
     * Callback responsável por expor
     * dados do JWT na sessão do frontend.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }

      return session;
    }
  },

  /**
   * Secret obrigatória para assinatura JWT.
   */
  secret: process.env.AUTH_SECRET
};