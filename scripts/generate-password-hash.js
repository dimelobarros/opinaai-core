const argon2 = require('argon2');

/**
 * Script responsável por gerar
 * um hash válido compatível com
 * o fluxo atual do sistema.
 *
 * O projeto utiliza argon2
 * no PasswordService.
 *
 * Portanto o hash precisa ser
 * gerado exatamente com argon2.
 */
async function generate() {
  const password = 'admin@12345';

  const hash = await argon2.hash(password);

  console.log('\nHASH GERADO:\n');
  console.log(hash);
}

generate();