import argon2 from 'argon2';

export class PasswordService {
    async compare(
        password: string,
        hash: string,
    ): Promise<boolean> {
        return argon2.verify(hash, password);
    }
}