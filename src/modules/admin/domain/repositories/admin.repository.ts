import { AdminEntity } from '../entities/admin.entity';

export interface AdminRepository {
    findById(id: string): Promise<AdminEntity | null>;
}