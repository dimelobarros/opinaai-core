/**
 * ARQUIVO: src/modules/resposta/infrastructure/resposta.repository.ts
 * CAMADA: infrastructure
 * MÓDULO: resposta
 *
 * RESPONSABILIDADE:
 * Persistir e recuperar respostas da avaliação no banco PostgreSQL real.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - consulta a tabela respostas;
 * - converte linhas SQL em entidades de domínio;
 * - lista respostas persistidas;
 * - busca respostas por avaliação;
 * - cria respostas;
 * - cria ou atualiza respostas respeitando a unicidade do banco.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este é o repository oficial real do módulo de respostas no OpinaAi Core.
 * A rota de envio da avaliação usa este arquivo para gravar as respostas
 * do participante de forma transacional.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo não implementa regra de negócio da avaliação.
 * Ele atua como adaptador de infraestrutura entre PostgreSQL e domínio.
 * As regras de envio, bloqueio e conclusão da avaliação ficam na camada api
 * e nos casos de uso da camada application.
 */

import type { PoolClient, QueryResultRow } from "pg";
import { pgPool } from "@/shared/infra/database/connection/postgres";
import { Resposta } from "../domain/resposta.types";

type RespostaRow = QueryResultRow & {
  id: string;
  avaliacao_id: string;
  pergunta_id: string;
  valor: string | number;
  comentario: string | null;
  criada_em: Date | string;
  atualizada_em: Date | string;
};

type CriarRespostaParams = {
  id: string;
  avaliacaoId: string;
  perguntaId: string;
  valor: number;
  comentario: string;
  criadaEm: string;
  atualizadaEm: string;
};

const CAMPOS_RESPOSTA_SQL = `
  id,
  avaliacao_id,
  pergunta_id,
  valor,
  comentario,
  criada_em,
  atualizada_em
`;

/**
 * ======================================================
 * 1. Repository de respostas
 * ======================================================
 *
 * Centraliza as operações SQL da tabela respostas.
 *
 * DECISÃO ARQUITETURAL:
 * O domínio trabalha com nomes em camelCase e entidade Resposta.
 * O banco trabalha com snake_case. Este repository faz essa tradução.
 */
export class RespostaRepository {
  /**
   * ======================================================
   * 2. Conversão de linha SQL em entidade de domínio
   * ======================================================
   *
   * Adapta o formato retornado pelo PostgreSQL para a entidade
   * usada pelos fluxos do módulo de resposta.
   *
   * OBSERVAÇÃO:
   * Campos numeric podem chegar como string pelo driver pg.
   * Por isso, valor é convertido explicitamente para number.
   */
  private mapRow(row: RespostaRow): Resposta {
    return new Resposta(
      row.id,
      row.avaliacao_id,
      row.pergunta_id,
      Number(row.valor),
      row.comentario ?? "",
      new Date(row.criada_em).toISOString(),
      new Date(row.atualizada_em).toISOString(),
    );
  }

  /**
   * ======================================================
   * 3. Listagem geral de respostas
   * ======================================================
   *
   * Lista respostas da mais recente para a mais antiga.
   *
   * USO ATUAL:
   * Este método não é essencial para a tela pública do OpinaAi Core,
   * mas pode ser usado por auditoria, inspeções técnicas ou páginas
   * administrativas antigas no projeto atual.
   *
   * OBSERVAÇÃO DE MIGRAÇÃO:
   * Na pasta limpa do GitHub/Vercel, este método pode ser reavaliado
   * se nenhuma parte do Core usar listagem geral de respostas.
   */
  async listarRespostas(client?: PoolClient): Promise<Resposta[]> {
    const executor = client ?? pgPool;

    const result = await executor.query<RespostaRow>(
      `
        SELECT
          ${CAMPOS_RESPOSTA_SQL}
        FROM respostas
        ORDER BY criada_em DESC
      `,
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  /**
   * ======================================================
   * 4. Busca de respostas por avaliação
   * ======================================================
   *
   * Recupera todas as respostas vinculadas a uma avaliação.
   *
   * IMPORTÂNCIA NO SISTEMA:
   * A resposta pertence à avaliação. Esta consulta permite recuperar
   * o conjunto já persistido para um ato avaliativo específico.
   */
  async buscarPorAvaliacaoId(
    avaliacaoId: string,
    client?: PoolClient,
  ): Promise<Resposta[]> {
    const executor = client ?? pgPool;
    const avaliacaoIdNormalizado = avaliacaoId.trim();

    const result = await executor.query<RespostaRow>(
      `
        SELECT
          ${CAMPOS_RESPOSTA_SQL}
        FROM respostas
        WHERE avaliacao_id = $1
        ORDER BY criada_em ASC
      `,
      [avaliacaoIdNormalizado],
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  /**
   * ======================================================
   * 5. Criação de resposta
   * ======================================================
   *
   * Insere uma nova resposta no banco.
   *
   * OBSERVAÇÃO:
   * Este método assume que ainda não existe resposta para a combinação
   * avaliacao_id + pergunta_id. No fluxo principal de envio, prefira
   * criarOuAtualizar, que respeita a constraint de unicidade.
   */
  async criar(
    params: CriarRespostaParams,
    client?: PoolClient,
  ): Promise<Resposta> {
    const executor = client ?? pgPool;

    const result = await executor.query<RespostaRow>(
      `
        INSERT INTO respostas (
          id,
          avaliacao_id,
          pergunta_id,
          valor,
          comentario,
          criada_em,
          atualizada_em
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          ${CAMPOS_RESPOSTA_SQL}
      `,
      [
        params.id.trim(),
        params.avaliacaoId.trim(),
        params.perguntaId.trim(),
        params.valor,
        params.comentario.trim(),
        params.criadaEm,
        params.atualizadaEm,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  /**
   * ======================================================
   * 6. Criação ou atualização de resposta
   * ======================================================
   *
   * Insere uma resposta nova ou atualiza a resposta já existente
   * para a mesma avaliação e pergunta.
   *
   * REGRA DE BANCO:
   * O modelo físico possui unicidade para:
   * - avaliacao_id;
   * - pergunta_id.
   *
   * USO NO CORE:
   * Este é o método principal usado pela rota /api/avaliacao/enviar.
   * Ele permite persistir o envio de forma idempotente dentro da
   * mesma avaliação, sem duplicar respostas por pergunta.
   */
  async criarOuAtualizar(
    params: CriarRespostaParams,
    client?: PoolClient,
  ): Promise<Resposta> {
    const executor = client ?? pgPool;

    const result = await executor.query<RespostaRow>(
      `
        INSERT INTO respostas (
          id,
          avaliacao_id,
          pergunta_id,
          valor,
          comentario,
          criada_em,
          atualizada_em
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (avaliacao_id, pergunta_id)
        DO UPDATE SET
          valor = EXCLUDED.valor,
          comentario = EXCLUDED.comentario,
          atualizada_em = EXCLUDED.atualizada_em
        RETURNING
          ${CAMPOS_RESPOSTA_SQL}
      `,
      [
        params.id.trim(),
        params.avaliacaoId.trim(),
        params.perguntaId.trim(),
        params.valor,
        params.comentario.trim(),
        params.criadaEm,
        params.atualizadaEm,
      ],
    );

    return this.mapRow(result.rows[0]);
  }
}
