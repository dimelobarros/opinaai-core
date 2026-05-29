/**
 * Entidade administrativa principal do sistema.
 *
 * Neste momento o Admin representa o único
 * perfil com acesso à área administrativa.
 *
 * Mantemos a estrutura simples e compatível
 * com a modelagem atual da aplicação.
 */
export class AdminEntity {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly email: string,
        public readonly role: string,
        public readonly isActive: boolean,
    ) { }

    /**
     * Verifica se o admin possui acesso válido.
     */
    canAccessAdminPanel(): boolean {
        return this.isActive && this.role === 'ADMIN';
    }
}