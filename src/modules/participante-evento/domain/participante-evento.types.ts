/**
 * ARQUIVO: src/modules/participante-evento/domain/participante-evento.types.ts
 * CAMADA: domain
 * MÓDULO: participante-evento
 *
 * RESPONSABILIDADE:
 * Definir os tipos e a entidade de domínio do participante materializado
 * dentro de um evento.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - define os status possíveis de um participante_evento;
 * - representa o participante anônimo materializado no evento;
 * - vincula o participante ao evento;
 * - vincula o participante ao invite token usado;
 * - vincula o participante à device session reconhecida;
 * - armazena status e timestamps do vínculo;
 * - expõe getters para leitura segura dos atributos;
 * - permite alteração controlada de status e data de atualização.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este arquivo define o modelo central do participante anônimo no OpinaAi Core.
 * A avaliação não pertence diretamente ao token nem ao dispositivo; ela pertence
 * ao participante_evento materializado por este vínculo.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo pertence ao domínio e não deve depender de banco, HTTP,
 * Next.js, React ou detalhes de infraestrutura. Ele representa apenas
 * a forma conceitual do participante dentro do evento.
 */

/**
 * ======================================================
 * 1. Status do participante_evento
 * ======================================================
 *
 * Define os estados possíveis do participante materializado.
 *
 * REGRAS:
 * - ativo: participante válido para o fluxo atual;
 * - bloqueado: participante impedido por regra antifraude;
 * - finalizado: participante cujo fluxo foi encerrado.
 */
export type ParticipanteEventoStatus = "ativo" | "bloqueado" | "finalizado";

/**
 * ======================================================
 * 2. Entidade ParticipanteEvento
 * ======================================================
 *
 * Representa o participante anônimo materializado dentro de um evento
 * a partir da combinação antifraude evento + invite token + device session.
 *
 * DECISÃO ARQUITETURAL:
 * O participante_evento é o dono conceitual da avaliação.
 * Essa separação impede que a avaliação seja tratada como pertencente
 * diretamente ao token público ou à sessão técnica do dispositivo.
 */
export class ParticipanteEvento {
  constructor(
    private _id: string,
    private _eventoId: string,
    private _inviteTokenId: string,
    private _deviceSessionId: string,
    private _status: ParticipanteEventoStatus,
    private _criadoEm: string,
    private _atualizadoEm: string,
  ) {}

  get id(): string {
    return this._id;
  }

  get eventoId(): string {
    return this._eventoId;
  }

  get inviteTokenId(): string {
    return this._inviteTokenId;
  }

  get deviceSessionId(): string {
    return this._deviceSessionId;
  }

  get status(): ParticipanteEventoStatus {
    return this._status;
  }

  set status(status: ParticipanteEventoStatus) {
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
