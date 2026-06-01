'use server';

import { signOut } from './auth';

/**
 * Server Action responsável por encerrar
 * a sessão autenticada.
 *
 * Mantemos esta responsabilidade dentro
 * da infraestrutura de autenticação para
 * seguir o mesmo padrão adotado pelo Auth.js.
 */
export async function logoutAction() {
    await signOut({
        redirectTo: '/login'
    });
}