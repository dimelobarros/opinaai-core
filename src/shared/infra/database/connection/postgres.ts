/**
 * ARQUIVO: src/shared/infra/database/connection/postgres.ts
 * CAMADA: infrastructure
 * MÓDULO: shared
 *
 * RESPONSABILIDADE:
 * Centralizar a criação e reutilização do pool de conexão com PostgreSQL.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - lê a variável de ambiente DATABASE_URL;
 * - valida se a conexão com banco foi configurada;
 * - cria um pool de conexão PostgreSQL usando o pacote pg;
 * - reutiliza o mesmo pool durante desenvolvimento com hot reload;
 * - exporta o pool usado pelos repositories reais do sistema.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este arquivo é a base da persistência real do OpinaAi Core.
 * Todos os repositories PostgreSQL dependem deste pool para consultar
 * e gravar dados no banco.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo não contém regra de negócio.
 * Ele pertence à infraestrutura compartilhada e deve depender apenas
 * da configuração de ambiente e do driver PostgreSQL.
 */

import { Pool } from "pg";

/**
 * ======================================================
 * 1. Registro global do pool em desenvolvimento
 * ======================================================
 *
 * Em ambientes como Next.js com hot reload, os módulos podem ser
 * reavaliados várias vezes durante o desenvolvimento.
 *
 * DECISÃO ARQUITETURAL:
 * Guardar o pool em globalThis evita criar conexões duplicadas
 * desnecessariamente enquanto o servidor local recarrega.
 */
const globalForPg = globalThis as unknown as {
  opinaAiPgPool?: Pool;
};

/**
 * ======================================================
 * 2. Criação do pool PostgreSQL
 * ======================================================
 *
 * Lê a DATABASE_URL e cria uma instância reutilizável do Pool.
 *
 * IMPORTÂNCIA:
 * A aplicação não deve conter credenciais fixas no código.
 * Em produção, inclusive na Vercel, a DATABASE_URL deve ser configurada
 * como variável de ambiente no painel da plataforma.
 */
function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  /**
   * ======================================================
   * 2.1. Validação da DATABASE_URL
   * ======================================================
   *
   * Sem DATABASE_URL, o OpinaAi Core não consegue acessar
   * o banco PostgreSQL real.
   */
  if (!connectionString) {
    throw new Error("DATABASE_URL_NAO_CONFIGURADA");
  }

  return new Pool({
    connectionString,
  });
}

/**
 * ======================================================
 * 3. Pool oficial compartilhado
 * ======================================================
 *
 * Este é o pool usado por repositories, rotas server-side
 * e health checks que acessam PostgreSQL.
 *
 * COMPORTAMENTO:
 * - em desenvolvimento, reaproveita o pool salvo em globalThis;
 * - em produção, cria a instância normal do Pool.
 */
export const pgPool = globalForPg.opinaAiPgPool ?? createPool();

/**
 * ======================================================
 * 4. Persistência do pool fora de produção
 * ======================================================
 *
 * Apenas em ambiente não produtivo o pool é guardado em globalThis.
 *
 * IMPORTÂNCIA:
 * Isso reduz conexões duplicadas durante hot reload local sem mudar
 * o comportamento esperado em produção.
 */
if (process.env.NODE_ENV !== "production") {
  globalForPg.opinaAiPgPool = pgPool;
}
