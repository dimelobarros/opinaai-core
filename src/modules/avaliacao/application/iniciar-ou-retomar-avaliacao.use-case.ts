/**
 * ARQUIVO: src/modules/avaliacao/application/iniciar-ou-retomar-avaliacao.use-case.ts
 * CAMADA: application
 * MÓDULO: avaliação
 *
 * RESPONSABILIDADE:
 * Executar o desfecho do fluxo de avaliação para um participante
 * já materializado dentro de um evento.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - recebe eventoId e participanteEventoId;
 * - consulta a decisão atual do fluxo da avaliação;
 * - cria nova avaliação quando ainda não existe uma avaliação para o participante;
 * - recupera avaliação existente quando o fluxo deve continuar ou bloquear;
 * - devolve resultado padronizado para a camada superior;
 * - consolida os desfechos: criada, continuada ou bloqueada.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este caso de uso transforma a decisão lógica do fluxo antifraude em uma
 * resposta concreta para a entrada pública da avaliação.
 * Ele é parte essencial do OpinaAi Core porque determina se o participante
 * seguirá para a tela de avaliação ou receberá bloqueio.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo não decide sozinho se a avaliação deve ser criada,
 * continuada ou bloqueada. Essa decisão pertence ao
 * DeterminarFluxoDeAvaliacaoUseCase. Aqui a responsabilidadeada ou bloqueada. Essa decisão pertence ao
 * DeterminarFluxoDeAvaliacaoUseCase. Aqui a responsabilidade é executar
 * e consolidar o desfecho final.
 */

import { AvaliacaoRepository } from "../infrastructure/avaliacao.repository";
import { CreateAvaliacaoUseCase } from "./create-avaliacao.use-case";
import { DeterminarFluxoDeAvaliacaoUseCase } from "./determinar-fluxo-de-avaliacao.use-case";
import { IniciarOuRetomarAvaliacaoResult } from "./iniciar-ou-retomar-avaliacao.types";

type IniciarOuRetomarAvaliacaoParams = {
  eventoId: string;
  participanteEventoId: string;
};

const MOTIVO_EVENTO_ID_OBRIGATORIO = "EVENTO_ID_OBRIGATORIO";
const MOTIVO_PARTICIPANTE_EVENTO_ID_OBRIGATORIO =
  "PARTICIPANTE_EVENTO_ID_OBRIGATORIO";
const MOTIVO_FLUXO_INCONSISTENTE_AVALIACAO_ID_AUSENTE =
  "FLUXO_INCONSISTENTE_AVALIACAO_ID_AUSENTE";
const MOTIVO_AVALIACAO_EXISTENTE_NAO_ENCONTRADA =
  "AVALIACAO_EXISTENTE_NAO_ENCONTRADA";
const MOTIVO_AVALIACAO_EM_ANDAMENTO = "AVALIACAO_EM_ANDAMENTO";
const MOTIVO_AVALIACAO_CANCELADA = "AVALIACAO_CANCELADA";
const MOTIVO_AVALIACAO_JA_CONCLUIDA = "AVALIACAO_JA_CONCLUIDA";

export class IniciarOuRetomarAvaliacaoUseCase {
  /**
   * ======================================================
   * 1. Dependências do desfecho do fluxo
   * ======================================================
   *
   * Cada dependência tem uma responsabilidade específica:
   * - DeterminarFluxoDeAvaliacaoUseCase decide o estado lógico do fluxo;
   * - CreateAvaliacaoUseCase cria a avaliação quando necessário;
   * - AvaliacaoRepository recupera a avaliação existente para retorno final.
   */
  constructor(
    private avaliarFluxoUseCase = new DeterminarFluxoDeAvaliacaoUseCase(),
    private createAvaliacaoUseCase = new CreateAvaliacaoUseCase(),
    private repository = new AvaliacaoRepository(),
  ) {}

  /**
   * ======================================================
   * 2. Execução do início ou retomada da avaliação
   * ======================================================
   *
   * FLUXO:
   * 1. normaliza os identificadores recebidos;
   * 2. consulta a decisão do fluxo para o participante;
   * 3. cria avaliação nova quando indicado;
   * 4. busca avaliação existente quando houver continuidade ou bloqueio;
   * 5. devolve resultado final padronizado.
   */
  async execute(
    params: IniciarOuRetomarAvaliacaoParams,
  ): Promise<IniciarOuRetomarAvaliacaoResult> {
    const eventoId = params.eventoId.trim();
    const participanteEventoId = params.participanteEventoId.trim();

    /**
     * ======================================================
     * 3. Validação mínima dos identificadores
     * ======================================================
     *
     * Este caso de uso deve receber ids já resolvidos pelos passos
     * anteriores do fluxo antifraude.
     */
    if (!eventoId) {
      throw new Error(MOTIVO_EVENTO_ID_OBRIGATORIO);
    }

    if (!participanteEventoId) {
      throw new Error(MOTIVO_PARTICIPANTE_EVENTO_ID_OBRIGATORIO);
    }

    /**
     * ======================================================
     * 4. Determinação do estado atual do fluxo
     * ======================================================
     *
     * O sistema consulta se, para este participante_evento,
     * a avaliação deve ser:
     * - criada;
     * - continuada;
     * - bloqueada.
     */
    const resultadoFluxo =
      await this.avaliarFluxoUseCase.execute(participanteEventoId);

    /**
     * ======================================================
     * 5. Criação de nova avaliação
     * ======================================================
     *
     * Se ainda não existe avaliação para o participante,
     * o fluxo cria uma nova avaliação com status em andamento.
     */
    if (resultadoFluxo.acao === "criar_nova") {
      const avaliacaoCriada = await this.createAvaliacaoUseCase.execute({
        eventoId,
        participanteEventoId,
      });

      return {
        acao: "criada",
        avaliacao: avaliacaoCriada,
      };
    }

    /**
     * ======================================================
     * 6. Consistência do resultado intermediário
     * ======================================================
     *
     * Se a ação não é criação, então o fluxo precisa informar
     * qual avaliação existente está envolvida.
     *
     * IMPORTÂNCIA:
     * A ausência de avaliacaoId indica inconsistência entre os
     * contratos dos casos de uso da camada de aplicação.
     */
    if (!resultadoFluxo.avaliacaoId) {
      throw new Error(MOTIVO_FLUXO_INCONSISTENTE_AVALIACAO_ID_AUSENTE);
    }

    /**
     * ======================================================
     * 7. Recuperação da avaliação existente
     * ======================================================
     *
     * Para continuidade ou bloqueio, a camada superior precisa
     * receber a avaliação concreta já persistida.
     */
    const avaliacaoExistente = await this.repository.buscarPorId(
      resultadoFluxo.avaliacaoId,
    );

    if (!avaliacaoExistente) {
      throw new Error(MOTIVO_AVALIACAO_EXISTENTE_NAO_ENCONTRADA);
    }

    /**
     * ======================================================
     * 8. Continuidade de avaliação em andamento
     * ======================================================
     *
     * Quando a avaliação já existe e ainda está em andamento,
     * o sistema devolve a avaliação para que a interface possa
     * continuar o questionário.
     */
    if (resultadoFluxo.acao === "continuar_existente") {
      return {
        acao: "continuada",
        motivo: MOTIVO_AVALIACAO_EM_ANDAMENTO,
        avaliacao: avaliacaoExistente,
      };
    }

    /**
     * ======================================================
     * 9. Bloqueio do fluxo
     * ======================================================
     *
     * Se o fluxo não é criação nem continuidade, o desfecho final
     * é bloqueio.
     *
     * REGRA:
     * - avaliação cancelada retorna AVALIACAO_CANCELADA;
     * - qualquer outro bloqueio neste ponto é tratado como
     *   AVALIACAO_JA_CONCLUIDA.
     */
    return {
      acao: "bloqueada",
      motivo:
        resultadoFluxo.motivo === MOTIVO_AVALIACAO_CANCELADA
          ? MOTIVO_AVALIACAO_CANCELADA
          : MOTIVO_AVALIACAO_JA_CONCLUIDA,
      avaliacao: avaliacaoExistente,
    };
  }
}
