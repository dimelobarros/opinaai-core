/**
 * ARQUIVO: src/modules/device-session/infrastructure/device-session.repository.ts
 * CAMADA: infrastructure
 * MÓDULO: device-session
 *
 * RESPONSABILIDADE:
 * Persistir e recuperar sessões técnicas de dispositivo no banco PostgreSQL real.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - consulta a tabela device_sessions;
 * - converte linhas SQL em entidades de domínio;
 * - lista sessões de dispositivo;
 * - busca sessão por id;
 * - busca sessão por invite token e fingerprint;
 * - cria nova sessão de dispositivo;
 * - atualiza o status de uma sessão existente.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este repository sustenta a identidade técnica do dispositivo dentro do
 * fluxo antifraude do OpinaAi Core. Ele é um dos pilares da regra que impede
 * uso indevido de tokens e repetição de avaliação por dispositivo.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo não decide regras de negócio.
 * Ele atua como adaptador de infraestrutura entre PostgreSQL e domínio.
 * As decisões de permitir, retomar ou bloquear o fluxo ficam nos casos de
 * uso da camada application.
 */

import { randomUUID } from "node:crypto";
import type { PoolClient, QueryResultRow } from "pg";
import { pgPool } from "@/shared/infra/database/connection/postgres";
import {
  DeviceSession,
  type DeviceSessionStatus,
} from "../domain/device-session.types";

type DeviceSessionRow = QueryResultRow & {
  id: string;
  invite_token_id: string;
  device_fingerprint: string;
  status: DeviceSessionStatus;
  criado_em: Date | string;
  atualizado_em: Date | string;
};

type CriarDeviceSessionParams = {
  id?: string;
  inviteTokenId: string;
  deviceFingerprint: string;
  status?: DeviceSessionStatus;
  criadoEm?: string;
  atualizadoEm?: string;
};

const STATUS_DEVICE_SESSION_ATIVA = "ativa";

const CAMPOS_DEVICE_SESSION_SQL = `
  id,
  invite_token_id,
  device_fingerprint,
  status,
  criado_em,
  atualizado_em
`;

/**
 * ======================================================
 * 1. Repository de device sessions
 * ======================================================
 *
 * Centraliza as operações SQL da tabela device_sessions.
 *
 * DECISÃO ARQUITETURAL:
 * O domínio trabalha com nomes em camelCase e entidade DeviceSession.
 * O banco trabalha com snake_case. Este repository faz essa tradução.
 */
export class DeviceSessionRepository {
  /**
   * ======================================================
   * 2. Conversão de linha SQL em entidade de domínio
   * ======================================================
   *
   * Adapta o formato retornado pelo PostgreSQL para a entidade
   * usada pelos casos de uso do módulo device-session.
   */
  private mapRow(row: DeviceSessionRow): DeviceSession {
    return new DeviceSession(
      row.id,
      row.invite_token_id,
      row.device_fingerprint,
      row.status,
      new Date(row.criado_em).toISOString(),
      new Date(row.atualizado_em).toISOString(),
    );
  }

  /**
   * ======================================================
   * 3. Listagem geral de device sessions
   * ======================================================
   *
   * Lista sessões da mais recente para a mais antiga.
   *
   * USO ATUAL:
   * Este método não é necessário para a entrada pública do OpinaAi Core,
   * mas pode ser usado por auditoria, inspeção técnica ou páginas
   * administrativas antigas no projeto atual.
   *
   * OBSERVAÇÃO DE MIGRAÇÃO:
   * Na pasta limpa do GitHub/Vercel, este método pode ser reavaliado
   * se nenhuma parte do Core usar listagem geral de sessões.
   */
  async listarDeviceSessions(client?: PoolClient): Promise<DeviceSession[]> {
    const executor = client ?? pgPool;

    const result = await executor.query<DeviceSessionRow>(
      `
        SELECT
          ${CAMPOS_DEVICE_SESSION_SQL}
        FROM device_sessions
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
   * Recupera uma sessão técnica pelo identificador primário.
   *
   * USO NO CORE:
   * Este método é usado quando o fluxo já conhece a sessão materializada
   * e precisa validar seu estado real no banco.
   */
  async buscarPorId(
    id: string,
    client?: PoolClient,
  ): Promise<DeviceSession | null> {
    const executor = client ?? pgPool;
    const idNormalizado = id.trim();

    const result = await executor.query<DeviceSessionRow>(
      `
        SELECT
          ${CAMPOS_DEVICE_SESSION_SQL}
        FROM device_sessions
        WHERE id = $1
        LIMIT 1
      `,
      [idNormalizado],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * ======================================================
   * 5. Busca por invite token e fingerprint
   * ======================================================
   *
   * Recupera uma sessão pela combinação:
   * - inviteTokenId;
   * - deviceFingerprint.
   *
   * REGRA DE BANCO:
   * A tabela device_sessions deve preservar unicidade para
   * invite_token_id + device_fingerprint.
   *
   * IMPORTÂNCIA:
   * O mesmo token usado no mesmo dispositivo deve apontar sempre
   * para a mesma sessão técnica.
   */
  async buscarPorInviteTokenIdEFingerprint(
    inviteTokenId: string,
    deviceFingerprint: string,
    client?: PoolClient,
  ): Promise<DeviceSession | null> {
    const executor = client ?? pgPool;
    const inviteTokenIdNormalizado = inviteTokenId.trim();
    const deviceFingerprintNormalizado = deviceFingerprint.trim();

    const result = await executor.query<DeviceSessionRow>(
      `
        SELECT
          ${CAMPOS_DEVICE_SESSION_SQL}
        FROM device_sessions
        WHERE invite_token_id = $1
          AND device_fingerprint = $2
        LIMIT 1
      `,
      [inviteTokenIdNormalizado, deviceFingerprintNormalizado],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * ======================================================
   * 6. Criação de device session
   * ======================================================
   *
   * Cria uma sessão técnica quando ainda não existe registro
   * para a combinação invite token + fingerprint.
   *
   * DECISÃO ARQUITETURAL:
   * O método aceita tanto um objeto simples de parâmetros quanto
   * uma entidade DeviceSession já montada. Isso preserva compatibilidade
   * com usos atuais sem acoplar o repository a um único formato de entrada.
   *
   * OBSERVAÇÃO DE SEGURANÇA:
   * O fingerprint textual segue o modelo atual do schema. Uma evolução
   * futura pode migrar esse valor para hash, desde que schema, dados e
   * fluxo de entrada sejam auditados em conjunto.
   */
  async criar(
    params: CriarDeviceSessionParams | DeviceSession,
    client?: PoolClient,
  ): Promise<DeviceSession> {
    const executor = client ?? pgPool;
    const agora = new Date().toISOString();

    /**
     * ======================================================
     * 6.1. Normalização dos dados de entrada
     * ======================================================
     *
     * Esta seção garante defaults seguros para:
     * - id;
     * - status;
     * - criadoEm;
     * - atualizadoEm.
     */
    const id =
      params instanceof DeviceSession
        ? params.id.trim()
        : (params.id ?? this.gerarId()).trim();

    const inviteTokenId =
      params instanceof DeviceSession
        ? params.inviteTokenId.trim()
        : params.inviteTokenId.trim();

    const deviceFingerprint =
      params instanceof DeviceSession
        ? params.deviceFingerprint.trim()
        : params.deviceFingerprint.trim();

    const status =
      params instanceof DeviceSession
        ? params.status
        : (params.status ?? STATUS_DEVICE_SESSION_ATIVA);

    const criadoEm =
      params instanceof DeviceSession
        ? params.criadoEm
        : (params.criadoEm ?? agora);

    const atualizadoEm =
      params instanceof DeviceSession
        ? params.atualizadoEm
        : (params.atualizadoEm ?? agora);

    /**
     * ======================================================
     * 6.2. Persistência da sessão do dispositivo
     * ======================================================
     *
     * Materializa no banco a sessão técnica associada ao uso do token.
     */
    const result = await executor.query<DeviceSessionRow>(
      `
        INSERT INTO device_sessions (
          id,
          invite_token_id,
          device_fingerprint,
          status,
          criado_em,
          atualizado_em
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          ${CAMPOS_DEVICE_SESSION_SQL}
      `,
      [id, inviteTokenId, deviceFingerprint, status, criadoEm, atualizadoEm],
    );

    return this.mapRow(result.rows[0]);
  }

  /**
   * ======================================================
   * 7. Atualização de status
   * ======================================================
   *
   * Atualiza o estado técnico de uma sessão de dispositivo.
   *
   * USO:
   * Pode refletir encerramento, bloqueio ou outra mudança de estado
   * definida por fluxos futuros.
   */
  async atualizarStatus(
    id: string,
    status: DeviceSessionStatus,
    atualizadoEm: string,
    client?: PoolClient,
  ): Promise<DeviceSession | null> {
    const executor = client ?? pgPool;
    const idNormalizado = id.trim();

    const result = await executor.query<DeviceSessionRow>(
      `
        UPDATE device_sessions
        SET
          status = $2,
          atualizado_em = $3
        WHERE id = $1
        RETURNING
          ${CAMPOS_DEVICE_SESSION_SQL}
      `,
      [idNormalizado, status, atualizadoEm],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * ======================================================
   * 8. Geração do identificador da device session
   * ======================================================
   *
   * Mantém o prefixo ds para legibilidade operacional e usa
   * randomUUID para reduzir risco de colisão.
   */
  private gerarId(): string {
    return `ds-${randomUUID()}`;
  }
}
