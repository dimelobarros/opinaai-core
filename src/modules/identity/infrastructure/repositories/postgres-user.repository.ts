import { pool } from '@/shared/infra/database/connection/postgres';

import { UserEntity } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';

/**
 * Repositório PostgreSQL de usuários.
 */
export class PostgresUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserEntity | null> {
    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query<UserEntity>(
      `
        SELECT
          id,
          name,
          email,
          password_hash,
          role,
          is_active
        FROM users
        WHERE email = $1
          AND is_active = TRUE
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [normalizedEmail]
    );

    if (!result.rows.length) {
      return null;
    }

    return result.rows[0];
  }
}