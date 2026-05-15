/**
 * ARQUIVO: determinar-fluxo-de-avaliacao.types.ts
 * CAMADA: Application / Types
 * MÓDULO: Avaliação
 *
 * RESPONSABILIDADE:
 * Definir o contrato de retorno da etapa que decide
 * o estado lógico do fluxo da avaliação.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - define as ações possíveis do fluxo
 * - define o formato do resultado devolvido
 *   pelo DeterminarFluxoDeAvaliacaoUseCase
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este arquivo padroniza a comunicação entre a etapa
 * de decisão do fluxo e os casos de uso que executam
 * a criação, continuidade ou bloqueio da avaliação.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo não implementa nenhuma lógica.
 * Ele apenas formaliza o contrato tipado da decisão.
 */

/**
 * Ações possíveis do fluxo da avaliação.
 *
 * SIGNIFICADO:
 * - criar_nova:
 *   ainda não existe avaliação para o participante
 *
 * - continuar_existente:
 *   já existe avaliação em andamento e ela deve ser retomada
 *
 * - bloquear:
 *   o fluxo não pode prosseguir para nova criação ou continuidade
 */
export type FluxoAvaliacaoAcao = "criar_nova" | "continuar_existente" | "bloquear";

/**
 * Contrato de retorno da decisão do fluxo.
 *
 * CAMPOS:
 * - acao:
 *   informa o desfecho lógico da etapa de decisão
 *
 * - motivo:
 *   informa a razão da continuidade ou bloqueio, quando aplicável
 *
 * - avaliacaoId:
 *   identifica a avaliação já existente envolvida na decisão,
 *   quando houver
 */
export type DeterminarFluxoDeAvaliacaoResult = {
  acao: FluxoAvaliacaoAcao;
  motivo?: string;
  avaliacaoId?: string;
};
