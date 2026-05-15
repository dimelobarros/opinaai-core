/**
 * ARQUIVO: src/modules/avaliacao/application/entrar-na-avaliacao.use-case.ts
 * CAMADA: application
 * MÓDULO: avaliação
 *
 * RESPONSABILIDADE:
 * Orquestrar a entrada inicial do participante no fluxo público de avaliação,
 * aplicando as regras antifraude antes de criar ou retomar uma avaliação.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - recebe o token digitado e o fingerprint do dispositivo;
 * - localiza o invite token correspondente;
 * - protege a regra de 1 token = 1 uso;
 * - protege a regra de 1 device = 1 avaliação por evento;
 * - permite retomada de avaliação em andamento quando o contexto é válido;
 * - bloqueia avaliação já concluída;
 * - cria ou obtém a sessão técnica do dispositivo somente quando permitido;
 * - delega a continuidade do fluxo ao caso de uso principal da avaliação;
 * - traduz erro estrutural de banco em erro funcional quando necessário.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este caso de uso é uma peça central do OpinaAi Core.
 * Ele conecta a entrada pública por token ao núcleo antifraude real,
 * impedindo uso indevido de token ou repetição de avaliação por dispositivo.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * A rota HTTP não deve implementar essas regras diretamente.
 * Este arquivo concentra a orquestração da entrada e delega consultas,
 * materializações e persistência para use cases e repositories especializados.
 */

import { ObterOuCriarDeviceSessionUseCase } from "@/modules/device-session/application/obter-ou-criar-device-session.use-case";
import { DeviceSessionRepository } from "@/modules/device-session/infrastructure/device-session.repository";
import { InviteTokenRepository } from "@/modules/invite-token/infrastructure/invite-token.repository";
import { ParticipanteEventoRepository } from "@/modules/participante-evento/infrastructure/participante-evento.repository";
import { AvaliacaoRepository } from "@/modules/avaliacao/infrastructure/avaliacao.repository";
import { IniciarFluxoDeAvaliacaoUseCase } from "./iniciar-fluxo-de-avaliacao.use-case";
import { IniciarOuRetomarAvaliacaoResult } from "./iniciar-ou-retomar-avaliacao.types";

type EntrarNaAvaliacaoParams = {
  codigoToken: string;
  deviceFingerprint: string;
};

type PgUniqueConstraintError = {
  code?: string;
  constraint?: string;
};

const STATUS_AVALIACAO_CONCLUIDA = "concluida";
const STATUS_AVALIACAO_EM_ANDAMENTO = "em_andamento";

const MOTIVO_AVALIACAO_CANCELADA = "AVALIACAO_CANCELADA";
const MOTIVO_AVALIACAO_EM_ANDAMENTO = "AVALIACAO_EM_ANDAMENTO";
const MOTIVO_AVALIACAO_JA_CONCLUIDA = "AVALIACAO_JA_CONCLUIDA";
const MOTIVO_DEVICE_JA_AVALIOU_EVENTO = "DEVICE_JA_AVALIOU_EVENTO";
const MOTIVO_TOKEN_NAO_ENCONTRADO = "TOKEN_DIGITADO_NAO_ENCONTRADO";
const MOTIVO_TOKEN_USADO_EM_OUTRO_DEVICE =
  "TOKEN_JA_UTILIZADO_EM_OUTRO_DISPOSITIVO";

const POSTGRES_UNIQUE_VIOLATION_CODE = "23505";
const CONSTRAINT_PARTICIPANTE_INVITE_TOKEN =
  "uq_participante_evento_invite_token";

export class EntrarNaAvaliacaoUseCase {
  /**
   * ======================================================
   * 1. Dependências do caso de uso
   * ======================================================
   *
   * As dependências seguem separadas por responsabilidade:
   * - InviteTokenRepository localiza o token digitado;
   * - ParticipanteEventoRepository verifica vínculos antifraude já materializados;
   * - DeviceSessionRepository recupera sessão técnica existente;
   * - AvaliacaoRepository recupera a avaliação associada ao participante;
   * - ObterOuCriarDeviceSessionUseCase materializa a sessão quando permitido;
   * - IniciarFluxoDeAvaliacaoUseCase continua o fluxo principal.
   */
  constructor(
    private inviteTokenRepository = new InviteTokenRepository(),
    private obterOuCriarDeviceSessionUseCase = new ObterOuCriarDeviceSessionUseCase(),
    private iniciarFluxoDeAvaliacaoUseCase = new IniciarFluxoDeAvaliacaoUseCase(),
    private participanteEventoRepository = new ParticipanteEventoRepository(),
    private avaliacaoRepository = new AvaliacaoRepository(),
    private deviceSessionRepository = new DeviceSessionRepository(),
  ) {}

  /**
   * ======================================================
   * 2. Entrada inicial na avaliação
   * ======================================================
   *
   * FLUXO:
   * 1. normaliza token e fingerprint;
   * 2. localiza o token digitado;
   * 3. verifica se o token já foi usado;
   * 4. verifica se o device já avaliou o evento;
   * 5. obtém ou cria a sessão do dispositivo;
   * 6. delega a continuidade ao fluxo principal.
   */
  async execute(
    params: EntrarNaAvaliacaoParams,
  ): Promise<IniciarOuRetomarAvaliacaoResult> {
    const codigoToken = params.codigoToken.trim();
    const deviceFingerprint = params.deviceFingerprint.trim();

    /**
     * ======================================================
     * 3. Busca do token digitado
     * ======================================================
     *
     * O token é o ponto de entrada do participante.
     * Sem token válido, o fluxo antifraude não pode continuar.
     */
    const inviteToken =
      await this.inviteTokenRepository.buscarPorCodigo(codigoToken);

    if (!inviteToken) {
      throw new Error(MOTIVO_TOKEN_NAO_ENCONTRADO);
    }

    /**
     * ======================================================
     * 4. Regra oficial: 1 token = 1 uso
     * ======================================================
     *
     * Antes de criar qualquer nova device session, verificamos
     * se este token já materializou um participante anteriormente.
     *
     * IMPORTÂNCIA:
     * Isso impede que um mesmo token seja reaproveitado por outro
     * dispositivo para criar nova participação.
     */
    const participantePorToken =
      await this.participanteEventoRepository.buscarPorInviteTokenId(
        inviteToken.id,
      );

    if (participantePorToken) {
      const avaliacaoExistente =
        await this.avaliacaoRepository.buscarPorParticipanteEventoId(
          participantePorToken.id,
        );

      const deviceSessionExistente =
        await this.deviceSessionRepository.buscarPorId(
          participantePorToken.deviceSessionId,
        );

      /**
       * ======================================================
       * 4.1. Token usado por outro dispositivo
       * ======================================================
       *
       * Se o token já foi vinculado a uma sessão de dispositivo diferente,
       * o bloqueio acontece antes de qualquer nova materialização.
       */
      if (
        deviceSessionExistente &&
        deviceSessionExistente.deviceFingerprint !== deviceFingerprint
      ) {
        if (avaliacaoExistente) {
          return {
            acao: "bloqueada",
            motivo: MOTIVO_TOKEN_USADO_EM_OUTRO_DEVICE,
            avaliacao: avaliacaoExistente,
          };
        }

        throw new Error(MOTIVO_TOKEN_USADO_EM_OUTRO_DEVICE);
      }

      /**
       * ======================================================
       * 4.2. Retomada pelo mesmo dispositivo
       * ======================================================
       *
       * Se o mesmo dispositivo retorna usando o mesmo token,
       * o sistema pode continuar avaliação em andamento, bloquear
       * avaliação concluída ou bloquear avaliação cancelada.
       */
      if (avaliacaoExistente) {
        if (avaliacaoExistente.status === STATUS_AVALIACAO_CONCLUIDA) {
          return {
            acao: "bloqueada",
            motivo: MOTIVO_AVALIACAO_JA_CONCLUIDA,
            avaliacao: avaliacaoExistente,
          };
        }

        if (avaliacaoExistente.status === STATUS_AVALIACAO_EM_ANDAMENTO) {
          return {
            acao: "continuada",
            motivo: MOTIVO_AVALIACAO_EM_ANDAMENTO,
            avaliacao: avaliacaoExistente,
          };
        }

        return {
          acao: "bloqueada",
          motivo: MOTIVO_AVALIACAO_CANCELADA,
          avaliacao: avaliacaoExistente,
        };
      }
    }

    /**
     * ======================================================
     * 5. Regra oficial: 1 device = 1 avaliação por evento
     * ======================================================
     *
     * Mesmo que outro token seja informado, o mesmo dispositivo não
     * pode criar nova avaliação para o mesmo evento se já houver
     * participante materializado.
     */
    const participantePorEventoEDevice =
      await this.participanteEventoRepository.buscarPorEventoIdEDeviceFingerprint(
        inviteToken.eventoId,
        deviceFingerprint,
      );

    if (participantePorEventoEDevice) {
      const avaliacaoExistente =
        await this.avaliacaoRepository.buscarPorParticipanteEventoId(
          participantePorEventoEDevice.id,
        );

      if (avaliacaoExistente) {
        if (avaliacaoExistente.status === STATUS_AVALIACAO_CONCLUIDA) {
          return {
            acao: "bloqueada",
            motivo: MOTIVO_DEVICE_JA_AVALIOU_EVENTO,
            avaliacao: avaliacaoExistente,
          };
        }

        if (avaliacaoExistente.status === STATUS_AVALIACAO_EM_ANDAMENTO) {
          return {
            acao: "continuada",
            motivo: MOTIVO_AVALIACAO_EM_ANDAMENTO,
            avaliacao: avaliacaoExistente,
          };
        }

        return {
          acao: "bloqueada",
          motivo: MOTIVO_AVALIACAO_CANCELADA,
          avaliacao: avaliacaoExistente,
        };
      }
    }

    /**
     * ======================================================
     * 6. Criação ou recuperação da device session
     * ======================================================
     *
     * Só chegamos aqui quando:
     * - o token ainda pode ser usado no contexto atual;
     * - o dispositivo ainda pode entrar no evento;
     * - não existe avaliação anterior bloqueante.
     */
    try {
      const deviceSession = await this.obterOuCriarDeviceSessionUseCase.execute(
        {
          inviteTokenId: inviteToken.id,
          deviceFingerprint,
        },
      );

      /**
       * ======================================================
       * 7. Delegação para o fluxo principal
       * ======================================================
       *
       * A partir da sessão do dispositivo, o fluxo principal
       * materializa participante e cria ou retoma a avaliação.
       */
      return await this.iniciarFluxoDeAvaliacaoUseCase.execute({
        eventoId: inviteToken.eventoId,
        inviteTokenId: inviteToken.id,
        deviceSessionId: deviceSession.id,
      });
    } catch (error) {
      /**
       * ======================================================
       * 8. Tradução de erro estrutural do banco
       * ======================================================
       *
       * A constraint uq_participante_evento_invite_token protege
       * fisicamente a regra de 1 token = 1 uso.
       *
       * Quando ela é violada, traduzimos o erro técnico do PostgreSQL
       * para um motivo funcional conhecido pela aplicação.
       */
      if (isPgUniqueConstraintError(error)) {
        throw new Error(MOTIVO_TOKEN_USADO_EM_OUTRO_DEVICE);
      }

      throw error;
    }
  }
}

/**
 * ======================================================
 * 9. Identificação de violação única do PostgreSQL
 * ======================================================
 *
 * Reconhece especificamente a violação da constraint que protege
 * a relação entre participante materializado e invite token.
 */
function isPgUniqueConstraintError(
  error: unknown,
): error is PgUniqueConstraintError {
  if (!error || typeof error !== "object") {
    return false;
  }

  const pgError = error as PgUniqueConstraintError;

  return (
    pgError.code === POSTGRES_UNIQUE_VIOLATION_CODE &&
    pgError.constraint === CONSTRAINT_PARTICIPANTE_INVITE_TOKEN
  );
}
