/**
 * ARQUIVO: src/shared/infra/database/transaction/with-transaction.ts
 * CAMADA: infrastructure
 * MÓDULO: shared
 *
 * RESPONSABILIDADE:
 * Executar blocos de persistência dentro de uma transação PostgreSQL.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - obtém uma conexão dedicada do pool PostgreSQL;
 * - inicia uma transação com BEGIN;
 * - executa a operação recebida por callback;
 * - confirma a transação com COMMIT em caso de sucesso;
 * - desfaz a transação com ROLLBACK em caso de erro;
 * - libera a conexão ao final da operação.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este arquivo garante integridade em operações compostas do OpinaAi Core.
 * Ele é essencial no envio da avaliação, onde respostas, comentário final
 * e status da avaliação precisam ser persistidos como uma única unidade lógica.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo não contém regra de negócio.
 * Ele fornece apenas infraestrutura transacional reutilizável para rotas,
 * use cases ou serviços que precisem executar múltiplas queries de forma atômica.
 */

import type { PoolClient } from "pg";
import { pgPool } from "../connection/postgres";

/**
 * ======================================================
 * 1. Execução transacional
 * ======================================================
 *
 * Executa uma operação dentro de uma transação real do PostgreSQL.
 *
 * PARÂMETRO:
 * - callback: função que recebe o client transacional e executa
 *   as queries que devem participar da mesma transação.
 *
 * FLUXO:
 * 1. obtém um client dedicado do pool;
 * 2. inicia a transação;
 * 3. executa o callback;
 * 4. confirma a transação se tudo der certo;
 * 5. desfaz a transação se houver erro;
 * 6. libera o client ao final.
 *
 * IMPORTÂNCIA:
 * Transações precisam usar o mesmo client do PostgreSQL.
 * Por isso, todas as queries transacionais devem receber o client
 * entregue pelo callback.
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pgPool.connect();

  try {
    /**
     * ======================================================
     * 2. Início da transação
     * ======================================================
     *
     * A partir deste ponto, todas as queries executadas com este
     * client pertencem à mesma unidade transacional.
     */
    await client.query("BEGIN");

    /**
     * ======================================================
     * 3. Execução do bloco transacional
     * ======================================================
     *
     * O callback contém as operações de persistência que precisam
     * ser tratadas como atômicas.
     */
    const result = await callback(client);

    /**
     * ======================================================
     * 4. Confirmação da transação
     * ======================================================
     *
     * Se nenhuma operação falhou, as alterações são confirmadas
     * definitivamente no banco.
     */
    await client.query("COMMIT");

    return result;
  } catch (error) {
    /**
     * ======================================================
     * 5. Reversão da transação
     * ======================================================
     *
     * Se qualquer erro ocorrer durante o bloco transacional,
     * as alterações feitas até o ponto da falha devem ser desfeitas.
     *
     * OBSERVAÇÃO:
     * Se o próprio ROLLBACK falhar, preservamos o erro original
     * para não mascarar a causa principal da falha transacional.
     */
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserva o erro original capturado no bloco transacional.
    }

    throw error;
  } finally {
    /**
     * ======================================================
     * 6. Liberação da conexão
     * ======================================================
     *
     * Independentemente de sucesso, erro ou rollback,
     * o client precisa ser devolvido ao pool.
     */
    client.release();
  }
}
