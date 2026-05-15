/**
 * ARQUIVO: src/modules/device-session/domain/device-session.types.ts
 * CAMADA: domain
 * MÓDULO: device-session
 *
 * RESPONSABILIDADE:
 * Definir os tipos e a entidade de domínio da sessão técnica de dispositivo.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - define os status possíveis de uma device session;
 * - representa a sessão técnica de um dispositivo no fluxo antifraude;
 * - vincula a sessão a um invite token;
 * - armazena o fingerprint técnico do dispositivo;
 * - armazena status e timestamps da sessão;
 * - expõe getters para leitura segura dos atributos;
 * - permite alteração controlada de fingerprint, status e data de atualização.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este arquivo define o modelo central da identificação técnica do dispositivo
 * no OpinaAi Core. A device session ajuda o sistema a reconhecer tentativas
 * de entrada, impedir reutilização indevida de token em outro dispositivo e
 * sustentar a regra de 1 device = 1 avaliação por evento.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo pertence ao domínio e não deve depender de banco, HTTP,
 * Next.js, React ou detalhes de infraestrutura. Ele representa apenas
 * a forma conceitual da sessão técnica dentro do sistema.
 */

/**
 * ======================================================
 * 1. Status da device session
 * ======================================================
 *
 * Define os estados possíveis de uma sessão técnica de dispositivo.
 *
 * REGRAS:
 * - ativa: sessão válida e em uso no fluxo;
 * - bloqueada: sessão impedida por regra antifraude;
 * - encerrada: sessão finalizada após conclusão ou término do fluxo.
 */
export type DeviceSessionStatus = "ativa" | "bloqueada" | "encerrada";

/**
 * ======================================================
 * 2. Entidade DeviceSession
 * ======================================================
 *
 * Representa o vínculo técnico entre um invite token utilizado
 * e um dispositivo identificado por fingerprint.
 *
 * DECISÃO ARQUITETURAL:
 * A device session não é o participante final da avaliação.
 * Ela é uma parte da identidade antifraude usada para materializar
 * o participante_evento.
 *
 * OBSERVAÇÃO DE SEGURANÇA:
 * O modelo atual mantém o fingerprint textual conforme o schema existente.
 * Uma evolução futura pode migrar esse valor para hash, mas isso exige
 * auditoria conjunta de banco, seeds, fluxo de entrada e dados existentes.
 */
export class DeviceSession {
  constructor(
    private _id: string,
    private _inviteTokenId: string,
    private _deviceFingerprint: string,
    private _status: DeviceSessionStatus,
    private _criadoEm: string,
    private _atualizadoEm: string,
  ) {}

  get id(): string {
    return this._id;
  }

  get inviteTokenId(): string {
    return this._inviteTokenId;
  }

  get deviceFingerprint(): string {
    return this._deviceFingerprint;
  }

  set deviceFingerprint(deviceFingerprint: string) {
    this._deviceFingerprint = deviceFingerprint;
  }

  get status(): DeviceSessionStatus {
    return this._status;
  }

  set status(status: DeviceSessionStatus) {
    this._status = status;
  }

  get criadoEm(): string {
    return this._criadoEm;
  }

  get atualizadoEm(): string {
    return this._atualizadoEm;
  }

  set atualizadoEm(atualizadoEm: string) {
    this._atualizadoEm = atualizadoEm;
  }
}
