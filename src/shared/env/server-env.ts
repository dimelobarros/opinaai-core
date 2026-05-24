import { z } from 'zod';

/**
 * Schema central das variáveis de ambiente.
 *
 * Responsabilidades:
 * - validar ambiente;
 * - impedir boot inválido;
 * - garantir consistência;
 * - evitar runtime surprises.
 *
 * Impacto arquitetural:
 *
 * Implementa estratégia fail-fast.
 * Se o ambiente estiver inconsistente, a aplicação falha imediatamente.
 */
const serverEnvSchema = z.object({
    AUTH_SECRET: z.string().min(1),
    AUTH_URL: z.string().min(1),

    INITIAL_ADMIN_EMAIL: z.string().email(),
    INITIAL_ADMIN_PASSWORD: z.string().min(8)
});

export const serverEnv = serverEnvSchema.parse({
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,

    INITIAL_ADMIN_EMAIL: process.env.INITIAL_ADMIN_EMAIL,
    INITIAL_ADMIN_PASSWORD: process.env.INITIAL_ADMIN_PASSWORD
});