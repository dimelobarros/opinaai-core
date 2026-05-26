import { z } from 'zod';

/**
 * Schema de validação do login.
 */
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});