import { auth } from '@/modules/identity/infrastructure/auth/auth';

/**
 * Helper central de recuperação de sessão.
 *
 * Impacto arquitetural:
 *
 * O restante do sistema NÃO deve acessar o Auth.js diretamente.
 * Isso reduz acoplamento e facilita:
 * - testes;
 * - refatoração;
 * - troca de provider.
 */
export async function getSession() {
    return auth();
}