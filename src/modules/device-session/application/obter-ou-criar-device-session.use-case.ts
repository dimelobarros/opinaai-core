/**
 * ARQUIVO: src/modules/device-session/application/obter-ou-criar-device-session.use-case.ts
 * CAMADA: application
 * MÓDULO: device-session
 *
 * RESPONSABILIDADE:
 * Garantir que o fluxo de entrada tenha uma sessão técnica de dispositivo
 * válida para a combinação entre invite token e fingerprint.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - recebe inviteTokenId e deviceFingerprint;
 * - normaliza e valida os dados mínimos;
 * - verifica se já existe sessão para a combinação recebida;
 * - reutiliza a sessão existente quando encontrada;
 * - cria uma nova sessão quando ainda não existe registro;
 * - devolve a sessão que será usada pelo fluxo antifraude.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este caso de uso conecta o token de acesso à identidade técnica do
 * dispositivo. Ele permite que o OpinaAi Core reconheça tentativas
 * repetidas do mesmo token no mesmo dispositivo sem criar duplicidade.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo não decide bloqueios antifraude por si só.
 * A decisão de permitir, retomar ou bloquear o fluxo acontece em casos
 * de uso superiores. Aqui a responsabilidade é apenas obter ou criar
 * a sessão técnica do dispositivo.
 */

import { DeviceSession } from "../domain/device-session.types";
import { DeviceSessionRepository } from "../infrastructure/device-session.repository";

type ObterOuCriarDeviceSessionParams = {
  inviteTokenId: string;
  deviceFingerprint: string;
};

const STATUS_DEVICE_SESSION_ATIVA = "ativa";
const MOTIVO_INVITE_TOKEN_ID_OBRIGATORIO = "INVITE_TOKEN_ID_OBRIGATORIO";
const MOTIVO_DEVICE_FINGERPRINT_OBRIGATORIO = "DEVICE_FINGERPRINT_OBRIGATORIO";

export class ObterOuCriarDeviceSessionUseCase {
  /**
   * ======================================================
   * 1. Dependência de persistência
   * ======================================================
   *
   * O repository delega ao banco real a leitura e escrita
   * das sessões técnicas de dispositivo.
   */
  constructor(private repository = new DeviceSessionRepository()) {}

  /**
   * ======================================================
   * 2. Obtenção ou criação da sessão do dispositivo
   * ======================================================
   *
   * FLUXO:
   * 1. normaliza inviteTokenId e deviceFingerprint;
   * 2. valida os dados obrigatórios;
   * 3. busca sessão existente para token + fingerprint;
   * 4. reutiliza a sessão quando ela já existe;
   * 5. cria nova sessão quando não existe registro anterior.
   */
  async execute(
    params: ObterOuCriarDeviceSessionParams,
  ): Promise<DeviceSession> {
    const inviteTokenId = params.inviteTokenId.trim();
    const deviceFingerprint = params.deviceFingerprint.trim();

    /**
     * ======================================================
     * 3. Validação mínima da entrada
     * ======================================================
     *
     * A sessão técnica sempre precisa estar associada a um
     * invite token e a um fingerprint de dispositivo.
     */
    if (!inviteTokenId) {
      throw new Error(MOTIVO_INVITE_TOKEN_ID_OBRIGATORIO);
    }

    if (!deviceFingerprint) {
      throw new Error(MOTIVO_DEVICE_FINGERPRINT_OBRIGATORIO);
    }

    /**
     * ======================================================
     * 4. Busca de sessão existente
     * ======================================================
     *
     * A combinação inviteTokenId + deviceFingerprint representa
     * a chave lógica da sessão técnica dentro do fluxo atual.
     *
     * DECISÃO ARQUITETURAL:
     * Reutilizar a sessão existente evita duplicidade quando
     * o mesmo token é usado novamente no mesmo dispositivo.
     */
    const existente = await this.repository.buscarPorInviteTokenIdEFingerprint(
      inviteTokenId,
      deviceFingerprint,
    );

    if (existente) {
      return existente;
    }

    /**
     * ======================================================
     * 5. Criação de nova sessão
     * ======================================================
     *
     * Só criamos uma sessão quando ainda não existe registro
     * para a combinação token + fingerprint.
     *
     * OBSERVAÇÃO:
     * Este registro ainda não significa autorização final da avaliação.
     * Ele apenas materializa a identidade técnica usada pelas próximas
     * etapas do fluxo antifraude.
     */
    const agora = new Date().toISOString();

    return this.repository.criar({
      inviteTokenId,
      deviceFingerprint,
      status: STATUS_DEVICE_SESSION_ATIVA,
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }
}
