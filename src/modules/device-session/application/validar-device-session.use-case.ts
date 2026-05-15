/**
 * ARQUIVO: src/modules/device-session/application/validar-device-session.use-case.ts
 * CAMADA: application
 * MÓDULO: device-session
 *
 * RESPONSABILIDADE:
 * Validar se uma sessão técnica de dispositivo pode ser aceita no fluxo
 * antifraude do OpinaAi Core.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - recebe deviceSessionId e inviteTokenId;
 * - busca a device session persistida no banco;
 * - verifica se a sessão existe;
 * - verifica se a sessão pertence ao invite token esperado;
 * - verifica se a sessão está ativa;
 * - retorna uma decisão padronizada para os casos de uso superiores.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este caso de uso protege a integridade técnica da identificação do
 * dispositivo dentro do fluxo antifraude. Ele impede que sessões inexistentes,
 * inativas ou vinculadas a outro token avancem para a materialização do
 * participante e da avaliação.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo não cria sessão, não cria participante e não decide avaliação.
 * Sua função é apenas validar a aceitabilidade da device session com base no
 * estado real persistido.
 */

import { DeviceSessionRepository } from "../infrastructure/device-session.repository";
import { ValidarDeviceSessionResult } from "./validar-device-session.types";

type ValidarDeviceSessionParams = {
  deviceSessionId: string;
  inviteTokenId: string;
};

const STATUS_DEVICE_SESSION_ATIVA = "ativa";

const MOTIVO_DEVICE_SESSION_NAO_ENCONTRADA = "DEVICE_SESSION_NAO_ENCONTRADA";
const MOTIVO_DEVICE_SESSION_INVITE_TOKEN_DIVERGENTE =
  "DEVICE_SESSION_INVITE_TOKEN_DIVERGENTE";
const MOTIVO_DEVICE_SESSION_STATUS_INVALIDO = "DEVICE_SESSION_STATUS_INVALIDO";

export class ValidarDeviceSessionUseCase {
  /**
   * ======================================================
   * 1. Dependência de persistência
   * ======================================================
   *
   * O repository recupera o estado real da device session.
   *
   * DECISÃO ARQUITETURAL:
   * A validação deve usar o banco real, não dados vindos da interface
   * nem estruturas mockadas.
   */
  constructor(private repository = new DeviceSessionRepository()) {}

  /**
   * ======================================================
   * 2. Validação da device session
   * ======================================================
   *
   * FLUXO:
   * 1. normaliza os identificadores recebidos;
   * 2. busca a sessão pelo id;
   * 3. falha se a sessão não existir;
   * 4. falha se a sessão não pertencer ao token esperado;
   * 5. falha se a sessão não estiver ativa;
   * 6. retorna válida se passar em todas as verificações.
   */
  async execute(
    params: ValidarDeviceSessionParams,
  ): Promise<ValidarDeviceSessionResult> {
    const deviceSessionId = params.deviceSessionId.trim();
    const inviteTokenId = params.inviteTokenId.trim();

    /**
     * ======================================================
     * 3. Busca da sessão persistida
     * ======================================================
     *
     * Sem uma sessão localizada no banco, não existe identificação
     * técnica válida para continuar o fluxo antifraude.
     *
     * DECISÃO DE CONTRATO:
     * Um deviceSessionId vazio é tratado como sessão não encontrada,
     * preservando os motivos já usados pelo módulo.
     */
    const deviceSession = deviceSessionId
      ? await this.repository.buscarPorId(deviceSessionId)
      : null;

    /**
     * ======================================================
     * 4. Sessão inexistente
     * ======================================================
     *
     * Se a sessão não existir, ela não pode ser aceita no fluxo.
     */
    if (!deviceSession) {
      return {
        valido: false,
        motivo: MOTIVO_DEVICE_SESSION_NAO_ENCONTRADA,
      };
    }

    /**
     * ======================================================
     * 5. Sessão divergente do invite token
     * ======================================================
     *
     * A sessão precisa estar vinculada exatamente ao invite token
     * esperado pelo fluxo atual.
     *
     * IMPORTÂNCIA:
     * Isso impede cruzamento indevido entre sessão técnica, token e evento.
     */
    if (!inviteTokenId || deviceSession.inviteTokenId !== inviteTokenId) {
      return {
        valido: false,
        motivo: MOTIVO_DEVICE_SESSION_INVITE_TOKEN_DIVERGENTE,
      };
    }

    /**
     * ======================================================
     * 6. Status inválido
     * ======================================================
     *
     * Apenas sessões ativas podem seguir no fluxo antifraude.
     */
    if (deviceSession.status !== STATUS_DEVICE_SESSION_ATIVA) {
      return {
        valido: false,
        motivo: MOTIVO_DEVICE_SESSION_STATUS_INVALIDO,
      };
    }

    /**
     * ======================================================
     * 7. Sessão aceita
     * ======================================================
     *
     * Se a sessão existe, pertence ao token esperado e está ativa,
     * ela pode continuar no fluxo.
     */
    return {
      valido: true,
      deviceSession,
    };
  }
}
