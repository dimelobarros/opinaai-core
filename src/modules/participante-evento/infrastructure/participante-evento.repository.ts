/**
 * ARQUIVO: src/modules/participante-evento/infrastructure/participante-evento.repository.ts
 * CAMADA: infrastructure
 * MÓDULO: participante-evento
 *
 * RESPONSABILIDADE:
 * Persistir e recuperar participantes materializados no banco PostgreSQL real.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - consulta a tabela participantes_evento;
 * - converte linhas SQL em entidades de domínio;
 * - lista participantes materializados;
 * - busca participante por id;
 * - busca participante pela tríade antifraude evento + token + deviceSession;
 * - busca participante por invite token;
 * - busca participante por evento + fingerprint do dispositivo;
 * - cria participante_evento;
 * - atualiza status do participante_evento.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este repository sustenta a materialização do participante anônimo dentro
 * do evento. Ele é um dos pilares do antifraude do OpinaAi Core porque conecta
 * evento, token usado e sessão técnica do dispositivo.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo não toma decisão de negócio.
 * Ele atua como adaptador de infraestrutura entre PostgreSQL e domínio.
 * As regras de permitir, retomar ou bloquear o fluxo ficam nos casos de uso
 * da camada application.
 */

import type { PoolClient, QueryResultRow } from "pg";
import { pgPool } from "@/shared/infra/database/connection/postgres";
import {
  ParticipanteEvento,
  type ParticipanteEventoStatus,
} from "../domain/participante-evento.types";

type ParticipanteEventoRow = QueryResultRow & {
  id: string;
  evento_id: string;
  invite_token_id: string;
  device_session_id: string;
  status: ParticipanteEventoStatus;
  criado_em: Date | string;
  atualizado_em: Date | string;
};

type CriarParticipanteEventoParams = {
  id: string;
  eventoId: string;
  inviteTokenId: string;
  deviceSessionId: string;
  status: ParticipanteEventoStatus;
  criadoEm: string;
  atualizadoEm: string;
};

const CAMPOS_PARTICIPANTE_EVENTO_SQL = `
  id,
  evento_id,
  invite_token_id,
  device_session_id,
  status,
  criado_em,
  atualizado_em
`;

const CAMPOS_PARTICIPANTE_EVENTO_COM_ALIAS_SQL = `
  pe.id,
  pe.evento_id,
  pe.invite_token_id,
  pe.device_session_id,
  pe.status,
  pe.criado_em,
  pe.atualizado_em
`;

/**
 * ======================================================
 * 1. Repository de participantes do evento
 * ======================================================
 *
 * Centraliza as operações SQL da tabela participantes_evento.
 *
 * DECISÃO ARQUITETURAL:
 * O domínio trabalha com nomes em camelCase e entidade ParticipanteEvento.
 * O banco trabalha com snake_case. Este repository faz essa tradução.
 */
export class ParticipanteEventoRepository {
  /**
   * ======================================================
   * 2. Conversão de linha SQL em entidade de domínio
   * ======================================================
   *
   * Adapta o formato retornado pelo PostgreSQL para a entidade
   * usada pelos casos de uso do módulo participante-evento.
   */
  private mapRow(row: ParticipanteEventoRow): ParticipanteEvento {
    return new ParticipanteEvento(
      row.id,
      row.evento_id,
      row.invite_token_id,
      row.device_session_id,
      row.status,
      new Date(row.criado_em).toISOString(),
      new Date(row.atualizado_em).toISOString(),
    );
  }

  /**
   * ======================================================
   * 3. Listagem geral de participantes materializados
   * ======================================================
   *
   * Lista participantes_evento do mais recente para o mais antigo.
   *
   * USO ATUAL:
   * Este método não é necessário para a entrada pública do OpinaAi Core,
   * mas pode ser usado por auditoria, inspeção técnica ou páginas
   * administrativas antigas no projeto atual.
   *
   * OBSERVAÇÃO DE MIGRAÇÃO:
   * Na pasta limpa do GitHub/Vercel, este método pode ser reavaliado
   * se nenhuma parte do Core usar listagem geral de participantes.
   */
  async listarParticipantesEvento(
    client?: PoolClient,
  ): Promise<ParticipanteEvento[]> {
    const executor = client ?? pgPool;

    const result = await executor.query<ParticipanteEventoRow>(
      `
        SELECT
          ${CAMPOS_PARTICIPANTE_EVENTO_SQL}
        FROM participantes_evento
        ORDER BY criado_em DESC
      `,
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  /**
   * ======================================================
   * 4. Busca por id
   * ======================================================
   *
   * Recupera um participante_evento pelo identificador primário.
   *
   * USO:
   * Serve para localizar um participante já materializado quando
   * o sistema conhece sua chave primária.
   */
  async buscarPorId(
    id: string,
    client?: PoolClient,
  ): Promise<ParticipanteEvento | null> {
    const executor = client ?? pgPool;
    const idNormalizado = id.trim();

    const result = await executor.query<ParticipanteEventoRow>(
      `
        SELECT
          ${CAMPOS_PARTICIPANTE_EVENTO_SQL}
        FROM participantes_evento
        WHERE id = $1
        LIMIT 1
      `,
      [idNormalizado],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * ======================================================
   * 5. Busca pela tríade antifraude
   * ======================================================
   *
   * Busca participante pela combinação:
   * - eventoId;
   * - inviteTokenId;
   * - deviceSessionId.
   *
   * IMPORTÂNCIA:
   * Esta é a forma mais específica de identificar um participante
   * materializado dentro do fluxo, considerando exatamente o token
   * e a sessão usados.
   */
  async buscarPorChavesAntifraude(
    eventoId: string,
    inviteTokenId: string,
    deviceSessionId: string,
    client?: PoolClient,
  ): Promise<ParticipanteEvento | null> {
    const executor = client ?? pgPool;
    const eventoIdNormalizado = eventoId.trim();
    const inviteTokenIdNormalizado = inviteTokenId.trim();
    const deviceSessionIdNormalizado = deviceSessionId.trim();

    const result = await executor.query<ParticipanteEventoRow>(
      `
        SELECT
          ${CAMPOS_PARTICIPANTE_EVENTO_SQL}
        FROM participantes_evento
        WHERE evento_id = $1
          AND invite_token_id = $2
          AND device_session_id = $3
        LIMIT 1
      `,
      [
        eventoIdNormalizado,
        inviteTokenIdNormalizado,
        deviceSessionIdNormalizado,
      ],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * ======================================================
   * 6. Busca por invite token
   * ======================================================
   *
   * Recupera participante materializado a partir do token usado.
   *
   * USO NO CORE:
   * Suporta a regra antifraude:
   * - 1 token = 1 uso.
   *
   * IMPORTÂNCIA:
   * Se já existir participante_evento para esse token, o sistema sabe
   * que o convite já entrou no fluxo.
   */
  async buscarPorInviteTokenId(
    inviteTokenId: string,
    client?: PoolClient,
  ): Promise<ParticipanteEvento | null> {
    const executor = client ?? pgPool;
    const inviteTokenIdNormalizado = inviteTokenId.trim();

    const result = await executor.query<ParticipanteEventoRow>(
      `
        SELECT
          ${CAMPOS_PARTICIPANTE_EVENTO_SQL}
        FROM participantes_evento
        WHERE invite_token_id = $1
        LIMIT 1
      `,
      [inviteTokenIdNormalizado],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * ======================================================
   * 7. Busca por evento e fingerprint do dispositivo
   * ======================================================
   *
   * Recupera participante materializado por:
   * - evento;
   * - fingerprint do dispositivo.
   *
   * USO NO CORE:
   * Suporta a regra antifraude:
   * - 1 device = 1 avaliação por evento.
   *
   * DECISÃO ARQUITETURAL:
   * Esta busca usa JOIN com device_sessions porque o fingerprint
   * do dispositivo fica salvo nessa tabela.
   *
   * IMPORTANTE:
   * Não usamos apenas deviceSessionId aqui porque o mesmo dispositivo
   * pode gerar sessões diferentes ao trocar de token. O fingerprint é
   * a aproximação técnica usada pelo fluxo atual para reconhecer o device.
   */
  async buscarPorEventoIdEDeviceFingerprint(
    eventoId: string,
    deviceFingerprint: string,
    client?: PoolClient,
  ): Promise<ParticipanteEvento | null> {
    const executor = client ?? pgPool;
    const eventoIdNormalizado = eventoId.trim();
    const deviceFingerprintNormalizado = deviceFingerprint.trim();

    const result = await executor.query<ParticipanteEventoRow>(
      `
        SELECT
          ${CAMPOS_PARTICIPANTE_EVENTO_COM_ALIAS_SQL}
        FROM participantes_evento pe
        INNER JOIN device_sessions ds
          ON ds.id = pe.device_session_id
        WHERE pe.evento_id = $1
          AND ds.device_fingerprint = $2
        LIMIT 1
      `,
      [eventoIdNormalizado, deviceFingerprintNormalizado],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * ======================================================
   * 8. Criação de participante_evento
   * ======================================================
   *
   * Cria o participante anônimo materializado dentro do evento.
   *
   * USO:
   * Este método é chamado quando o sistema já decidiu que:
   * - o token é válido;
   * - o device pode entrar;
   * - ainda não existe vínculo materializado para aquele contexto.
   *
   * IMPORTÂNCIA:
   * Este é o momento em que o participante anônimo passa a existir
   * formalmente dentro do evento.
   */
  async criar(
    params: CriarParticipanteEventoParams,
    client?: PoolClient,
  ): Promise<ParticipanteEvento> {
    const executor = client ?? pgPool;

    const result = await executor.query<ParticipanteEventoRow>(
      `
        INSERT INTO participantes_evento (
          id,
          evento_id,
          invite_token_id,
          device_session_id,
          status,
          criado_em,
          atualizado_em
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          ${CAMPOS_PARTICIPANTE_EVENTO_SQL}
      `,
      [
        params.id.trim(),
        params.eventoId.trim(),
        params.inviteTokenId.trim(),
        params.deviceSessionId.trim(),
        params.status,
        params.criadoEm,
        params.atualizadoEm,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  /**
   * ======================================================
   * 9. Atualização de status
   * ======================================================
   *
   * Atualiza o status de um participante_evento.
   *
   * OBSERVAÇÃO:
   * O status do participante não substitui o status da avaliação.
   * Cada um representa uma dimensão diferente do fluxo.
   */
  async atualizarStatus(
    id: string,
    status: ParticipanteEventoStatus,
    atualizadoEm: string,
    client?: PoolClient,
  ): Promise<ParticipanteEvento | null> {
    const executor = client ?? pgPool;
    const idNormalizado = id.trim();

    const result = await executor.query<ParticipanteEventoRow>(
      `
        UPDATE participantes_evento
        SET
          status = $2,
          atualizado_em = $3
        WHERE id = $1
        RETURNING
          ${CAMPOS_PARTICIPANTE_EVENTO_SQL}
      `,
      [idNormalizado, status, atualizadoEm],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }
}
