/**
 * ARQUIVO: src/modules/resposta/domain/resposta.types.ts
 * CAMADA: domain
 * MÓDULO: resposta
 *
 * RESPONSABILIDADE:
 * Definir a entidade de domínio da resposta enviada em uma avaliação.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - representa uma resposta individual de uma avaliação;
 * - vincula a resposta a uma avaliação;
 * - vincula a resposta a uma pergunta;
 * - armazena o valor numérico da resposta;
 * - armazena comentário opcional da resposta;
 * - expõe getters para leitura segura dos atributos;
 * - permite alteração controlada de valor, comentário e data de atualização.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este arquivo define o modelo central de resposta no OpinaAi Core.
 * As respostas são persistidas no envio final da avaliação e representam
 * o conteúdo efetivamente informado pelo participante.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo pertence ao domínio e não deve depender de banco, HTTP,
 * Next.js, React ou detalhes de infraestrutura. Ele representa apenas
 * a forma conceitual da resposta dentro do sistema.
 */

/**
 * ======================================================
 * 1. Entidade Resposta
 * ======================================================
 *
 * Representa uma resposta vinculada a uma pergunta dentro
 * de uma avaliação.
 *
 * DECISÃO ARQUITETURAL:
 * A resposta pertence à avaliação e à pergunta. A persistência real
 * garante unicidade para a combinação avaliação + pergunta.
 */
export class Resposta {
  constructor(
    private _id: string,
    private _avaliacaoId: string,
    private _perguntaId: string,
    private _valor: number,
    private _comentario: string,
    private _criadaEm: string,
    private _atualizadaEm: string,
  ) {}

  get id(): string {
    return this._id;
  }

  get avaliacaoId(): string {
    return this._avaliacaoId;
  }

  get perguntaId(): string {
    return this._perguntaId;
  }

  get valor(): number {
    return this._valor;
  }

  set valor(valor: number) {
    this._valor = valor;
  }

  get comentario(): string {
    return this._comentario;
  }

  set comentario(comentario: string) {
    this._comentario = comentario;
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
}
