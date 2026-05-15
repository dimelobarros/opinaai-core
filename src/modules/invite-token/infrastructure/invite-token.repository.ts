/**
 * ARQUIVO: src/modules/invite-token/infrastructure/invite-token.repository.ts
 * CAMADA: infrastructure
 * MÓDULO: invite-token
 *
 * RESPONSABILIDADE:
 * Recuperar invite tokens persistidos no banco PostgreSQL real.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - consulta a tabela invite_tokens;
 * - converte linhas SQL em entidades de domínio;
 * - lista tokens cadastrados;
 * - busca token por id interno;
 * - busca token pelo código digitado na interface pública.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este repository é a porta de persistência do token de convite.
 * No OpinaAi Core, todo acesso público à avaliação começa pela localização
 * de um invite token real no banco.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo não aplica regra de negócio antifraude.
 * Ele apenas lê o estado persistido do token. As decisões sobre status,
 * expiração, uso do token e bloqueio do fluxo ficam nos casos de uso da
 * camada application.
 */

import type { PoolClient, QueryResultRow } from "pg";
import { pgPool } from "@/shared/infra/database/connection/postgres";
import {
  InviteToken,
  type InviteTokenStatus,
} from "../domain/invite-token.types";

type InviteTokenRow = QueryResultRow & {
  id: string;
  evento_id: string;
  token: string;
  status: InviteTokenStatus;
  expira_em: Date | string;
  criado_em: Date | string;
  atualizado_em: Date | string;
};

const CAMPOS_INVITE_TOKEN_SQL = `
  id,
  evento_id,
  token,
  status,
  expira_em,
  criado_em,
  atualizado_em
`;

/**
 * ======================================================
 * 1. Repository de invite tokens
 * ======================================================
 *
 * Centraliza as operações SQL da tabela invite_tokens.
 *
 * DECISÃO ARQUITETURAL:
 * O domínio trabalha com nomes em camelCase e entidade InviteToken.
 * O banco trabalha com snake_case. Este repository faz essa tradução.
 */
export class InviteTokenRepository {
  /**
   * ======================================================
   * 2. Conversão de linha SQL em entidade de domínio
   * ======================================================
   *
   * Adapta o formato retornado pelo PostgreSQL para a entidade
   * usada pelos casos de uso do módulo invite-token.
   */
  private mapRow(row: InviteTokenRow): InviteToken {
    return new InviteToken(
      row.id,
      row.evento_id,
      row.token,
      row.status,
      new Date(row.expira_em).toISOString(),
      new Date(row.criado_em).toISOString(),
      new Date(row.atualizado_em).toISOString(),
    );
  }

  /**
   * ======================================================
   * 3. Listagem geral de invite tokens
   * ======================================================
   *
   * Lista tokens da base, ordenando do mais recente para o mais antigo.
   *
   * USO ATUAL:
   * Este método não é necessário para a entrada pública do OpinaAi Core,
   * mas pode ser usado por auditoria, inspeção técnica ou páginas
   * administrativas antigas no projeto atual.
   *
   * OBSERVAÇÃO DE MIGRAÇÃO:
   * Na pasta limpa do GitHub/Vercel, este método pode ser reavaliado
   * se nenhuma parte do Core usar listagem geral de tokens.
   */
  async listarInviteTokens(client?: PoolClient): Promise<InviteToken[]> {
    const executor = client ?? pgPool;

    const result = await executor.query<InviteTokenRow>(
      `
        SELECT
          ${CAMPOS_INVITE_TOKEN_SQL}
        FROM invite_tokens
        ORDER BY criado_em DESC
      `,
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  /**
   * ======================================================
   * 4. Busca por id interno
   * ======================================================
   *
   * Recupera um invite token pelo identificador interno.
   *
   * USO NO CORE:
   * Este método é usado nas validações internas depois que o token
   * já foi localizado e o fluxo passa a trabalhar com ids persistidos.
   */
  async buscarPorId(
    id: string,
    client?: PoolClient,
  ): Promise<InviteToken | null> {
    const executor = client ?? pgPool;
    const idNormalizado = id.trim();

    const result = await executor.query<InviteTokenRow>(
      `
        SELECT
          ${CAMPOS_INVITE_TOKEN_SQL}
        FROM invite_tokens
        WHERE id = $1
        LIMIT 1
      `,
      [idNormalizado],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * ======================================================
   * 5. Busca por código digitado
   * ======================================================
   *
   * Recupera um invite token pelo código informado na interface pública.
   *
   * USO NO CORE:
   * Este é o método mais importante deste repository para o fluxo público.
   * A entrada em /entrar-avaliacao começa com o token digitado pelo
   * participante e depende deste lookup para descobrir:
   * - se o token existe;
   * - a qual evento ele pertence;
   * - qual é seu status atual;
   * - qual é sua validade.
   *
   * OBSERVAÇÃO DE SEGURANÇA:
   * O modelo atual consulta a coluna token textual existente no schema.
   * Uma futura evolução pode migrar para hash de token, mas isso exige
   * auditoria conjunta de schema, seed, dados existentes e fluxo de entrada.
   */
  async buscarPorCodigo(
    codigo: string,
    client?: PoolClient,
  ): Promise<InviteToken | null> {
    const executor = client ?? pgPool;
    const codigoNormalizado = codigo.trim();

    const result = await executor.query<InviteTokenRow>(
      `
        SELECT
          ${CAMPOS_INVITE_TOKEN_SQL}
        FROM invite_tokens
        WHERE token = $1
        LIMIT 1
      `,
      [codigoNormalizado],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }
}
