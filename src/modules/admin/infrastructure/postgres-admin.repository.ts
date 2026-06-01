import { pool } from '@/shared/infra/database/connection/postgres';

import { AdminEntity } from '../domain/admin.entity';
import { AdminRepository } from './admin.repository';

/**
 * Repository responsável por carregar
 * informações administrativas do banco.
 */
export class PostgresAdminRepository
    implements AdminRepository {
    async findById(id: string): Promise<AdminEntity | null> {
        const result = await pool.query(
            `
        SELECT
          id,
          name,
          email,
          role,
          is_active
        FROM users
        WHERE id = $1
          AND role = 'ADMIN'
          AND is_active = TRUE
        LIMIT 1
      `,
            [id],
        );

        if (!result.rows.length) {
            return null;
        }

        const row = result.rows[0];

        return new AdminEntity(
            row.id,
            row.name,
            row.email,
            row.role,
            row.is_active,
        );
    }
}