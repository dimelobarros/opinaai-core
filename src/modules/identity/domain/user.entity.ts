/**
 * Entidade de domínio do usuário.
 *
 * O projeto utiliza entidades baseadas
 * em interfaces/types neste módulo.
 *
 * Esta estrutura representa o usuário
 * persistido no banco.
 */
export interface UserEntity {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    role: string;
    is_active: boolean;
}