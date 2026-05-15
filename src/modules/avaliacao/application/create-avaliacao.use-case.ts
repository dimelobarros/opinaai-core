/**
 * ARQUIVO: src/modules/avaliacao/application/create-avaliacao.use-case.ts
 * CAMADA: application
 * MÓDULO: avaliação
 *
 * RESPONSABILIDADE:
 * Criar uma nova avaliação em andamento para um participante já materializado
 * dentro de um evento.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - recebe eventoId e participanteEventoId;
 * - valida os identificadores mínimos necessários;
 * - gera o identificador da nova avaliação;
 * - define os timestamps iniciais;
 * - persiste a avaliação com status inicial em_andamento.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este caso de uso materializa formalmente o início da avaliação dentro
 * do fluxo autorizado do OpinaAi Core.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo não valida token, dispositivo ou participante.
 * Ele assume que a autorização antifraude já foi resolvida nas etapas
 * anteriores e se limita à criação da avaliação.
 */

import { randomUUID } from "node:crypto";
import { Avaliacao } from "../domain/avaliacao.types";
import { AvaliacaoRepository } from "../infrastructure/avaliacao.repository";

type CreateAvaliacaoParams = {
  eventoId: string;
  participanteEventoId: string;
};

const STATUS_AVALIACAO_EM_ANDAMENTO = "em_andamento";
const MOTIVO_EVENTO_ID_OBRIGATORIO = "EVENTO_ID_OBRIGATORIO";
const MOTIVO_PARTICIPANTE_EVENTO_ID_OBRIGATORIO =
  "PARTICIPANTE_EVENTO_ID_OBRIGATORIO";

export class CreateAvaliacaoUseCase {
  /**
   * ======================================================
   * 1. Dependência de persistência
   * ======================================================
   *
   * O repository é responsável por gravar a nova avaliação
   * na infraestrutura real de banco de dados.
   */
  constructor(private repository = new AvaliacaoRepository()) {}

  /**
   * ======================================================
   * 2. Criação da avaliação
   * ======================================================
   *
   * FLUXO:
   * 1. normaliza os identificadores recebidos;
   * 2. valida os dados mínimos;
   * 3. gera o timestamp inicial;
   * 4. monta a avaliação em andamento;
   * 5. persiste a avaliação no banco.
   *
   * REGRA DE NEGÓCIO:
   * Toda avaliação nova nasce em andamento. A conclusão só acontece
   * depois do envio das respostas pela rota /api/avaliacao/enviar.
   */
  async execute(params: CreateAvaliacaoParams): Promise<Avaliacao> {
    const eventoId = params.eventoId.trim();
    const participanteEventoId = params.participanteEventoId.trim();

    /**
     * ======================================================
     * 3. Validação mínima dos identificadores
     * ======================================================
     *
     * A avaliação precisa estar vinculada a um evento e a um
     * participante_evento materializado pelo fluxo antifraude.
     */
    if (!eventoId) {
      throw new Error(MOTIVO_EVENTO_ID_OBRIGATORIO);
    }

    if (!participanteEventoId) {
      throw new Error(MOTIVO_PARTICIPANTE_EVENTO_ID_OBRIGATORIO);
    }

    /**
     * ======================================================
     * 4. Montagem da avaliação inicial
     * ======================================================
     *
     * O mesmo timestamp é usado para criação e atualização inicial.
     * O comentário final nasce vazio e só é atualizado no envio.
     */
    const agora = new Date().toISOString();

    return this.repository.criar({
      id: this.gerarId(),
      eventoId,
      participanteEventoId,
      status: STATUS_AVALIACAO_EM_ANDAMENTO,
      comentarioFinal: "",
      criadaEm: agora,
      atualizadaEm: agora,
    });
  }

  /**
   * ======================================================
   * 5. Geração do identificador da avaliação
   * ======================================================
   *
   * Mantém o prefixo ava para legibilidade operacional e usa
   * randomUUID para reduzir risco de colisão.
   */
  private gerarId(): string {
    return `ava-${randomUUID()}`;
  }
}
