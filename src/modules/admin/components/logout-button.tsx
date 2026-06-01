import { logoutAction } from '@/modules/identity/infrastructure/auth/logout.action';

/**
 * Botão responsável por encerrar
 * a sessão do administrador.
 */
export function LogoutButton() {
    return (
        <form action={logoutAction}>
            <button
                type="submit"
                className="rounded border px-4 py-2 text-sm"
            >
                Sair
            </button>
        </form>
    );
}