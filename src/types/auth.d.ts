import { Role } from '@/modules/identity/domain/enums/role.enum';

import 'next-auth';

/**
 * Extensão de tipos do Auth.js.
 *
 * Responsabilidade:
 *
 * Permitir que a sessão carregue:
 * - id do usuário;
 * - role (papel);
 * - dados administrativos.
 *
 * Impacto arquitetural:
 *
 * Garante tipagem consistente em:
 * - frontend;
 * - backend;
 * - middleware;
 * - server actions futuras.
 */
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            role: Role;
            email: string;
            name: string;
        };
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role: Role;
    }
}