/**
 * ARQUIVO: src/modules/avaliacao/domain/avaliacao.types.ts
 * CAMADA: domain
 * MÓDULO: avaliação
 *
 * RESPONSABILIDADE:
 * Definir os tipos e a entidade de domínio da avaliação.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - define os status possíveis de uma avaliação;
 * - representa uma avaliação como entidade de domínio;
 * - encapsula os dados centrais da avaliação;
 * - expõe getters para leitura segura dos atributos;
 * - permite alteração controlada de status, atualização e comentário final.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este arquivo define o modelo central da avaliação no OpinaAi Core.
 * Use cases, repositories e rotas dependem desta entidade para representar
 * avaliações criadas, retomadas, concluídas ou bloqueadas.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo pertence ao domínio e não deve depender de banco, HTTP,
 * Next.js, React ou detalhes de infraestrutura. Ele representa apenas
 * a forma conceitual da avaliação dentro do sistema.
 */

/**
 * ======================================================
 * 1. Status da avaliação
 * ======================================================
 *
 * Define os estados possíveis de uma avaliação no fluxo atual.
 *
 * REGRAS:
 * - em_andamento: avaliação aberta para resposta;
 * - concluida: avaliação encerrada e não reabrível;
 * - cancelada: avaliação interrompida ou bloqueada por regra futura.
 */
export type AvaliacaoStatus = "em_andamento" | "concluida" | "cancelada";

/**
 * ======================================================
 * 2. Entidade Avaliacao
 * ======================================================
 *
 * Representa o ato avaliativo de um participante materializado
 * dentro de um evento.
 *
 * DECISÃO ARQUITETURAL:
 * A avaliação pertence ao participante_evento, não diretamente
 * ao token nem à sessão do dispositivo.
 */
export class Avaliacao {
  constructor(
    private _id: string,
    private _eventoId: string,
    private _participanteEventoId: string,
    private _status: AvaliacaoStatus,
    private _criadaEm: string,
    private _atualizadaEm: string,
    private _comentarioFinal: string = "",
  ) {}

  get id(): string {
    return this._id;
  }

  get eventoId(): string {
    return this._eventoId;
  }

  get participanteEventoId(): string {
    return this._participanteEventoId;
  }

  get status(): AvaliacaoStatus {
    return this._status;
  }

  set status(status: AvaliacaoStatus) {
    this._status = status;
  }

  get criadaEm(): string {
    return this._criadaEm;
  }

  get atualizadaEm(): string {
    return this._atualizadaEm;
  }

  set atualizadaEm(atualizadaEm: string) {
    this._atualizadaEm = atualizadaEm;
  }

  get comentarioFinal(): string {
    return this._comentarioFinal;
  }

  set comentarioFinal(comentarioFinal: string) {
    this._comentarioFinal = comentarioFinal;
  }
}
