import { AdminEntity } from '../domain/admin.entity';

export interface AdminRepository {
    findById(id: string): Promise<AdminEntity | null>;
}