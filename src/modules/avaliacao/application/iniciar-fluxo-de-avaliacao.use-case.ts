/**
 * ARQUIVO: src/modules/avaliacao/application/iniciar-fluxo-de-avaliacao.use-case.ts
 * CAMADA: application
 * MÓDULO: avaliação
 *
 * RESPONSABILIDADE:
 * Orquestrar o início completo do fluxo de avaliação depois que o token,
 * o evento e a sessão do dispositivo já foram identificados.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - recebe eventoId, inviteTokenId e deviceSessionId;
 * - valida o invite token;
 * - valida a sessão do dispositivo;
 * - garante coerência entre evento, token e sessão;
 * - materializa o participante anônimo do evento;
 * - delega a decisão de criar ou retomar a avaliação;
 * - bloqueia o fluxo quando alguma relação antifraude está inconsistente.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este arquivo é o núcleo de orquestração do fluxo antifraude interno.
 * Ele conecta validação, materialização do participante e decisão de
 * início ou retomada da avaliação.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este caso de uso não faz persistência direta. Ele coordena use cases
 * especializados e mantém a regra de coerência do fluxo fora das rotas HTTP.
 */

import { ValidarDeviceSessionUseCase } from "@/modules/device-session/application/validar-device-session.use-case";
import { ValidarInviteTokenUseCase } from "@/modules/invite-token/application/validar-invite-token.use-case";
import { MaterializarParticipanteEventoUseCase } from "@/modules/participante-evento/application/materializar-participante-evento.use-case";
import { IniciarOuRetomarAvaliacaoUseCase } from "./iniciar-ou-retomar-avaliacao.use-case";
import { IniciarOuRetomarAvaliacaoResult } from "./iniciar-ou-retomar-avaliacao.types";

type IniciarFluxoDeAvaliacaoParams = {
  eventoId: string;
  inviteTokenId: string;
  deviceSessionId: string;
};

const MOTIVO_EVENTO_ID_OBRIGATORIO = "EVENTO_ID_OBRIGATORIO";
const MOTIVO_INVITE_TOKEN_ID_OBRIGATORIO = "INVITE_TOKEN_ID_OBRIGATORIO";
const MOTIVO_DEVICE_SESSION_ID_OBRIGATORIO = "DEVICE_SESSION_ID_OBRIGATORIO";
const MOTIVO_INVITE_TOKEN_EVENTO_DIVERGENTE = "INVITE_TOKEN_EVENTO_DIVERGENTE";
const MOTIVO_DEVICE_SESSION_NAO_PERTENCE_AO_INVITE_TOKEN =
  "DEVICE_SESSION_NAO_PERTENCE_AO_INVITE_TOKEN";

export class IniciarFluxoDeAvaliacaoUseCase {
  /**
   * ======================================================
   * 1. Dependências do fluxo
   * ======================================================
   *
   * Cada dependência protege uma parte do fluxo:
   * - ValidarInviteTokenUseCase confirma se o token pode ser usado;
   * - ValidarDeviceSessionUseCase confirma se a sessão técnica é válida;
   * - MaterializarParticipanteEventoUseCase cria ou recupera o participante;
   * - IniciarOuRetomarAvaliacaoUseCase decide se a avaliação será criada ou retomada.
   */
  constructor(
    private validarInviteTokenUseCase = new ValidarInviteTokenUseCase(),
    private validarDeviceSessionUseCase = new ValidarDeviceSessionUseCase(),
    private materializarParticipanteEventoUseCase = new MaterializarParticipanteEventoUseCase(),
    private iniciarOuRetomarAvaliacaoUseCase = new IniciarOuRetomarAvaliacaoUseCase(),
  ) {}

  /**
   * ======================================================
   * 2. Execução do fluxo principal
   * ======================================================
   *
   * FLUXO:
   * 1. normaliza os identificadores recebidos;
   * 2. valida o invite token;
   * 3. garante que o token pertence ao evento;
   * 4. valida a device session;
   * 5. garante que a sessão pertence ao token;
   * 6. materializa o participante do evento;
   * 7. inicia ou retoma a avaliação.
   */
  async execute(
    params: IniciarFluxoDeAvaliacaoParams,
  ): Promise<IniciarOuRetomarAvaliacaoResult> {
    const eventoId = params.eventoId.trim();
    const inviteTokenId = params.inviteTokenId.trim();
    const deviceSessionId = params.deviceSessionId.trim();

    /**
     * ======================================================
     * 3. Validação mínima dos identificadores
     * ======================================================
     *
     * Estes ids já deveriam chegar resolvidos pela entrada pública.
     * Mesmo assim, o caso de uso protege sua própria fronteira.
     */
    if (!eventoId) {
      throw new Error(MOTIVO_EVENTO_ID_OBRIGATORIO);
    }

    if (!inviteTokenId) {
      throw new Error(MOTIVO_INVITE_TOKEN_ID_OBRIGATORIO);
    }

    if (!deviceSessionId) {
      throw new Error(MOTIVO_DEVICE_SESSION_ID_OBRIGATORIO);
    }

    /**
     * ======================================================
     * 4. Validação do invite token
     * ======================================================
     *
     * O token é validado pelo módulo especializado de invite-token.
     * Sem token válido, não existe entrada legítima no fluxo.
     */
    const inviteTokenValidado =
      await this.validarInviteTokenUseCase.execute(inviteTokenId);

    if (!inviteTokenValidado.valido) {
      throw new Error(inviteTokenValidado.motivo);
    }

    /**
     * ======================================================
     * 5. Coerência entre token e evento
     * ======================================================
     *
     * Mesmo com token válido, o sistema confirma se ele pertence
     * ao evento esperado pelo fluxo atual.
     *
     * IMPORTÂNCIA:
     * Isso impede que um token de um evento seja usado para iniciar
     * uma avaliação em outro evento.
     */
    if (inviteTokenValidado.inviteToken.eventoId !== eventoId) {
      throw new Error(MOTIVO_INVITE_TOKEN_EVENTO_DIVERGENTE);
    }

    /**
     * ======================================================
     * 6. Validação da device session
     * ======================================================
     *
     * A sessão técnica do dispositivo também precisa estar válida
     * antes da materialização do participante.
     */
    const deviceSessionValidada =
      await this.validarDeviceSessionUseCase.execute({
        deviceSessionId,
        inviteTokenId,
      });

    if (!deviceSessionValidada.valido) {
      throw new Error(deviceSessionValidada.motivo);
    }

    /**
     * ======================================================
     * 7. Coerência entre sessão e token
     * ======================================================
     *
     * A sessão do dispositivo precisa pertencer ao mesmo invite token
     * usado no fluxo atual.
     *
     * IMPORTÂNCIA:
     * Isso impede cruzamento indevido entre sessões, tokens e eventos.
     */
    if (deviceSessionValidada.deviceSession.inviteTokenId !== inviteTokenId) {
      throw new Error(MOTIVO_DEVICE_SESSION_NAO_PERTENCE_AO_INVITE_TOKEN);
    }

    /**
     * ======================================================
     * 8. Materialização do participante do evento
     * ======================================================
     *
     * Depois de validar token e sessão, o sistema cria ou recupera
     * o participante anônimo materializado dentro daquele evento.
     *
     * DECISÃO ARQUITETURAL:
     * A avaliação pertence ao participante_evento, e não diretamente
     * ao token nem à device session.
     */
    const participanteEvento =
      await this.materializarParticipanteEventoUseCase.execute({
        eventoId,
        inviteTokenId,
        deviceSessionId,
      });

    /**
     * ======================================================
     * 9. Início ou retomada da avaliação
     * ======================================================
     *
     * Com o participante materializado, outro caso de uso decide
     * se a avaliação deve ser criada, retomada ou bloqueada.
     */
    return this.iniciarOuRetomarAvaliacaoUseCase.execute({
      eventoId,
      participanteEventoId: participanteEvento.id,
    });
  }
}
