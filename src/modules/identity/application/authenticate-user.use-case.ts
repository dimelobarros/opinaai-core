import { PasswordService } from '../infrastructure/auth/password';
import { PostgresUserRepository } from '../infrastructure/repositories/postgres-user.repository';

const repository = new PostgresUserRepository();

/**
 * Caso de uso responsável pela autenticação.
 */
export class AuthenticateUserUseCase {
  async execute(email: string, password: string) {
    const user = await repository.findByEmail(email);

    if (!user) {
      return null;
    }

    const passwordMatches = await PasswordService.verify(
      user.password_hash,
      password
    );

    if (!passwordMatches) {
      return null;
    }

    return user;
  }
}