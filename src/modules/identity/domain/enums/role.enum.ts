/**
 * Enum central de roles do sistema.
 *
 * Mesmo existindo apenas ADMIN inicialmente,
 * a estrutura já é preparada para expansão futura.
 *
 * Isso evita:
 * - hardcoded permissions;
 * - refatorações grandes;
 * - acoplamento de autorização.
 */
export enum Role {
    ADMIN = 'ADMIN'
}