import argon2 from 'argon2';

/**
 * Serviço responsável por:
 * - hash de senha;
 * - verificação criptográfica;
 * - abstração do provider criptográfico.
 *
 * Impacto arquitetural:
 *
 * O restante do sistema NÃO deve conhecer o argon2 diretamente.
 *
 * Isso permite:
 * - trocar algoritmo futuramente;
 * - padronizar segurança;
 * - centralizar política criptográfica.
 */
export class PasswordService {
    /**
     * Gera hash seguro da senha.
     */
    static async hash(password: string) {
        return argon2.hash(password);
    }

    /**
     * Verifica se senha corresponde ao hash.
     */
    static async verify(hash: string, password: string) {
        return argon2.verify(hash, password);
    }
}