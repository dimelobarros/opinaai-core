/**
 * Entidade do usuário.
 */
export interface UserEntity {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    role: string;
    is_active: boolean;
}