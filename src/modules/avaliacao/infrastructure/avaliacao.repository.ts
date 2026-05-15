/**
 * ARQUIVO: src/modules/avaliacao/infrastructure/avaliacao.repository.ts
 * CAMADA: infrastructure
 * MÓDULO: avaliação
 *
 * RESPONSABILIDADE:
 * Persistir e recuperar avaliações no banco PostgreSQL real.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - consulta a tabela avaliacoes;
 * - converte linhas SQL em entidades de domínio;
 * - cria avaliações;
 * - busca avaliações por id;
 * - busca avaliações por participante_evento;
 * - atualiza status da avaliação;
 * - atualiza comentário final da avaliação.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este é o repository oficial real do módulo de avaliação no OpinaAi Core.
 * Toda leitura e escrita persistida de avaliações usadas no fluxo público
 * passa por este arquivo.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo não implementa regra de negócio antifraude.
 * Ele atua como adaptador de infraestrutura entre PostgreSQL e domínio.
 * As decisões de criar, continuar, bloquear ou concluir avaliações ficam
 * nos casos de uso da camada application.
 */

import type { PoolClient, QueryResultRow } from "pg";
import { pgPool } from "@/shared/infra/database/connection/postgres";
import { Avaliacao, type AvaliacaoStatus } from "../domain/avaliacao.types";

type AvaliacaoRow = QueryResultRow & {
  id: string;
  evento_id: string;
  participante_evento_id: string;
  status: AvaliacaoStatus;
  comentario_final: string | null;
  criada_em: Date | string;
  atualizada_em: Date | string;
};

type CriarAvaliacaoParams = {
  id: string;
  eventoId: string;
  participanteEventoId: string;
  status: AvaliacaoStatus;
  criadaEm: string;
  atualizadaEm: string;
  comentarioFinal: string;
};

const CAMPOS_AVALIACAO_SQL = `
  id,
  evento_id,
  participante_evento_id,
  status,
  comentario_final,
  criada_em,
  atualizada_em
`;

/**
 * ======================================================
 * 1. Repository de avaliações
 * ======================================================
 *
 * Centraliza as operações SQL da tabela avaliacoes.
 *
 * DECISÃO ARQUITETURAL:
 * O domínio trabalha com nomes em camelCase e entidade Avaliacao.
 * O banco trabalha com snake_case. Este repository faz essa tradução.
 */
export class AvaliacaoRepository {
  /**
   * ======================================================
   * 2. Conversão de linha SQL em entidade de domínio
   * ======================================================
   *
   * Adapta o formato retornado pelo PostgreSQL para a entidade usada
   * pelos casos de uso do módulo avaliação.
   */
  private mapRow(row: AvaliacaoRow): Avaliacao {
    return new Avaliacao(
      row.id,
      row.evento_id,
      row.participante_evento_id,
      row.status,
      new Date(row.criada_em).toISOString(),
      new Date(row.atualizada_em).toISOString(),
      row.comentario_final ?? "",
    );
  }

  /**
   * ======================================================
   * 3. Listagem geral de avaliações
   * ======================================================
   *
   * Lista avaliações da mais recente para a mais antiga.
   *
   * USO ATUAL:
   * Este método não é essencial para a tela pública do OpinaAi Core,
   * mas pode ser usado por auditoria, páginas administrativas antigas
   * ou verificações técnicas no projeto atual.
   *
   * OBSERVAÇÃO DE MIGRAÇÃO:
   * Na pasta limpa do GitHub/Vercel, este método pode ser reavaliado
   * se a versão Core não incluir nenhuma superfície de listagem geral.
   */
  async listarAvaliacoes(client?: PoolClient): Promise<Avaliacao[]> {
    const executor = client ?? pgPool;

    const result = await executor.query<AvaliacaoRow>(
      `
        SELECT
          ${CAMPOS_AVALIACAO_SQL}
        FROM avaliacoes
        ORDER BY criada_em DESC
      `,
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  /**
   * ======================================================
   * 4. Busca por participante_evento
   * ======================================================
   *
   * Recupera a avaliação vinculada ao participante materializado.
   *
   * REGRA DE BANCO:
   * O modelo real possui unicidade para participante_evento_id,
   * portanto o retorno esperado é uma única avaliação ou null.
   *
   * IMPORTÂNCIA NO SISTEMA:
   * Esta é uma das consultas centrais do fluxo antifraude, pois
   * a avaliação pertence ao participante_evento, não diretamente
   * ao token nem à device session.
   */
  async buscarPorParticipanteEventoId(
    participanteEventoId: string,
    client?: PoolClient,
  ): Promise<Avaliacao | null> {
    const executor = client ?? pgPool;
    const participanteEventoIdNormalizado = participanteEventoId.trim();

    const result = await executor.query<AvaliacaoRow>(
      `
        SELECT
          ${CAMPOS_AVALIACAO_SQL}
        FROM avaliacoes
        WHERE participante_evento_id = $1
        LIMIT 1
      `,
      [participanteEventoIdNormalizado],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * ======================================================
   * 5. Busca por id da avaliação
   * ======================================================
   *
   * Recupera uma avaliação pelo identificador primário.
   *
   * USO:
   * Este método é usado quando o fluxo já conhece o id da avaliação,
   * como na retomada, bloqueio, carregamento de perguntas ou envio final.
   */
  async buscarPorId(
    id: string,
    client?: PoolClient,
  ): Promise<Avaliacao | null> {
    const executor = client ?? pgPool;
    const idNormalizado = id.trim();

    const result = await executor.query<AvaliacaoRow>(
      `
        SELECT
          ${CAMPOS_AVALIACAO_SQL}
        FROM avaliacoes
        WHERE id = $1
        LIMIT 1
      `,
      [idNormalizado],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * ======================================================
   * 6. Criação de avaliação
   * ======================================================
   *
   * Persiste uma nova avaliação no banco.
   *
   * REGRA OPERACIONAL:
   * A avaliação normalmente nasce com status em_andamento.
   * Essa regra é definida no caso de uso de criação; aqui o repository
   * apenas grava os dados recebidos.
   */
  async criar(
    params: CriarAvaliacaoParams,
    client?: PoolClient,
  ): Promise<Avaliacao> {
    const executor = client ?? pgPool;

    const result = await executor.query<AvaliacaoRow>(
      `
        INSERT INTO avaliacoes (
          id,
          evento_id,
          participante_evento_id,
          status,
          comentario_final,
          criada_em,
          atualizada_em
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          ${CAMPOS_AVALIACAO_SQL}
      `,
      [
        params.id.trim(),
        params.eventoId.trim(),
        params.participanteEventoId.trim(),
        params.status,
        params.comentarioFinal,
        params.criadaEm,
        params.atualizadaEm,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  /**
   * ======================================================
   * 7. Atualização de status
   * ======================================================
   *
   * Atualiza o estado da avaliação.
   *
   * USO NO CORE:
   * A rota de envio usa este método para marcar a avaliação
   * como concluída após persistir respostas e comentário final.
   */
  async atualizarStatus(
    avaliacaoId: string,
    status: AvaliacaoStatus,
    atualizadaEm: string,
    client?: PoolClient,
  ): Promise<Avaliacao | null> {
    const executor = client ?? pgPool;
    const avaliacaoIdNormalizado = avaliacaoId.trim();

    const result = await executor.query<AvaliacaoRow>(
      `
        UPDATE avaliacoes
        SET
          status = $2,
          atualizada_em = $3
        WHERE id = $1
        RETURNING
          ${CAMPOS_AVALIACAO_SQL}
      `,
      [avaliacaoIdNormalizado, status, atualizadaEm],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * ======================================================
   * 8. Atualização de comentário final
   * ======================================================
   *
   * Atualiza o comentário final informado pelo participante
   * na etapa de conclusão da avaliação.
   */
  async atualizarComentarioFinal(
    avaliacaoId: string,
    comentarioFinal: string,
    atualizadaEm: string,
    client?: PoolClient,
  ): Promise<Avaliacao | null> {
    const executor = client ?? pgPool;
    const avaliacaoIdNormalizado = avaliacaoId.trim();

    const result = await executor.query<AvaliacaoRow>(
      `
        UPDATE avaliacoes
        SET
          comentario_final = $2,
          atualizada_em = $3
        WHERE id = $1
        RETURNING
          ${CAMPOS_AVALIACAO_SQL}
      `,
      [avaliacaoIdNormalizado, comentarioFinal, atualizadaEm],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }
}
