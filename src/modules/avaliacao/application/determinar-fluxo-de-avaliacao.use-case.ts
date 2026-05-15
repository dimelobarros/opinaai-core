/**
 * ARQUIVO: src/modules/avaliacao/application/determinar-fluxo-de-avaliacao.use-case.ts
 * CAMADA: application
 * MÓDULO: avaliação
 *
 * RESPONSABILIDADE:
 * Determinar o desfecho lógico do fluxo de avaliação para um participante
 * já materializado dentro de um evento.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - recebe o id do participante_evento;
 * - busca a avaliação vinculada a esse participante;
 * - decide se o fluxo deve criar uma nova avaliação;
 * - decide se o fluxo deve continuar uma avaliação existente;
 * - decide se o fluxo deve ser bloqueado;
 * - devolve uma decisão padronizada para o próximo caso de uso.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este caso de uso é o ponto decisório do estado da avaliação.
 * Ele informa à camada superior se a avaliação ainda não existe, se está
 * em andamento ou se já não pode prosseguir.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo não cria avaliação nem retorna a entidade final completa.
 * Ele apenas determina a ação lógica que será executada pelo fluxo seguinte.
 */

import { AvaliacaoRepository } from "../infrastructure/avaliacao.repository";
import { DeterminarFluxoDeAvaliacaoResult } from "./determinar-fluxo-de-avaliacao.types";

const STATUS_AVALIACAO_CONCLUIDA = "concluida";
const STATUS_AVALIACAO_EM_ANDAMENTO = "em_andamento";

const MOTIVO_PARTICIPANTE_EVENTO_ID_OBRIGATORIO =
  "PARTICIPANTE_EVENTO_ID_OBRIGATORIO";
const MOTIVO_AVALIACAO_JA_CONCLUIDA = "AVALIACAO_JA_CONCLUIDA";
const MOTIVO_AVALIACAO_EM_ANDAMENTO = "AVALIACAO_EM_ANDAMENTO";
const MOTIVO_AVALIACAO_CANCELADA = "AVALIACAO_CANCELADA";

export class DeterminarFluxoDeAvaliacaoUseCase {
  /**
   * ======================================================
   * 1. Dependência de persistência
   * ======================================================
   *
   * O repository consulta o estado real da avaliação vinculada
   * ao participante_evento.
   *
   * DECISÃO ARQUITETURAL:
   * A decisão do fluxo deve ser tomada com base no banco real,
   * não em estado de interface ou mock.
   */
  constructor(private repository = new AvaliacaoRepository()) {}

  /**
   * ======================================================
   * 2. Determinação do fluxo da avaliação
   * ======================================================
   *
   * FLUXO:
   * 1. normaliza e valida o id do participante_evento;
   * 2. busca a avaliação vinculada ao participante;
   * 3. se não existir avaliação, orienta criação;
   * 4. se estiver concluída, orienta bloqueio;
   * 5. se estiver em andamento, orienta continuidade;
   * 6. para outros estados, orienta bloqueio.
   */
  async execute(
    participanteEventoId: string,
  ): Promise<DeterminarFluxoDeAvaliacaoResult> {
    const participanteEventoIdNormalizado = participanteEventoId.trim();

    /**
     * ======================================================
     * 3. Validação mínima da entrada
     * ======================================================
     *
     * Sem participante_evento, não é possível descobrir se já existe
     * avaliação para aquele participante anônimo do evento.
     */
    if (!participanteEventoIdNormalizado) {
      throw new Error(MOTIVO_PARTICIPANTE_EVENTO_ID_OBRIGATORIO);
    }

    /**
     * ======================================================
     * 4. Busca da avaliação vinculada ao participante
     * ======================================================
     *
     * A avaliação pertence ao participante_evento materializado
     * anteriormente pelo fluxo antifraude.
     */
    const avaliacao = await this.repository.buscarPorParticipanteEventoId(
      participanteEventoIdNormalizado,
    );

    /**
     * ======================================================
     * 5. Avaliação inexistente
     * ======================================================
     *
     * Se ainda não existe avaliação para este participante,
     * o fluxo seguinte deve criar uma nova avaliação.
     */
    if (!avaliacao) {
      return {
        acao: "criar_nova",
      };
    }

    /**
     * ======================================================
     * 6. Avaliação já concluída
     * ======================================================
     *
     * REGRA DE NEGÓCIO:
     * Uma avaliação concluída não pode ser reaberta nem respondida novamente.
     */
    if (avaliacao.status === STATUS_AVALIACAO_CONCLUIDA) {
      return {
        acao: "bloquear",
        motivo: MOTIVO_AVALIACAO_JA_CONCLUIDA,
        avaliacaoId: avaliacao.id,
      };
    }

    /**
     * ======================================================
     * 7. Avaliação em andamento
     * ======================================================
     *
     * Se a avaliação ainda está aberta, o fluxo deve continuar
     * a mesma avaliação existente.
     */
    if (avaliacao.status === STATUS_AVALIACAO_EM_ANDAMENTO) {
      return {
        acao: "continuar_existente",
        motivo: MOTIVO_AVALIACAO_EM_ANDAMENTO,
        avaliacaoId: avaliacao.id,
      };
    }

    /**
     * ======================================================
     * 8. Avaliação em estado não continuável
     * ======================================================
     *
     * Estados diferentes de em andamento ou concluída são tratados
     * como bloqueio para preservar a segurança do fluxo.
     */
    return {
      acao: "bloquear",
      motivo: MOTIVO_AVALIACAO_CANCELADA,
      avaliacaoId: avaliacao.id,
    };
  }
}
