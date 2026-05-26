import { UserEntity } from '../entities/user.entity';

/**
 * Contrato do repositório de usuários.
 *
 * Objetivo:
 * Desacoplar regra de negócio da persistência.
 */
export interface UserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
}