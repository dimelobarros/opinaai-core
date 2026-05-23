import { handlers } from '@/modules/identity/infrastructure/auth/auth';

/**
 * Route Handler oficial do Auth.js.
 *
 * Responsabilidade:
 *
 * Expor os endpoints HTTP necessários para:
 * - login;
 * - logout;
 * - sessão;
 * - callbacks;
 * - CSRF.
 *
 * Impacto arquitetural:
 *
 * Mantém a autenticação integrada ao App Router,
 * respeitando a arquitetura atual do sistema.
 */
export const { GET, POST } = handlers;