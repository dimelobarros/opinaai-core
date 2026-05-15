/**
 * ARQUIVO: iniciar-ou-retomar-avaliacao.types.ts
 * CAMADA: Application / Types
 * MÓDULO: Avaliação
 *
 * RESPONSABILIDADE:
 * Definir o contrato de retorno do fluxo que decide
 * se a avaliação será criada, continuada ou bloqueada.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - define os motivos possíveis de bloqueio/continuidade
 * - define o formato exato do resultado devolvido
 *   pelo fluxo de início ou retomada da avaliação
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este arquivo padroniza a comunicação entre os use cases
 * da camada de aplicação e as camadas superiores que consomem
 * a decisão do fluxo.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo não executa lógica.
 * Ele apenas formaliza o contrato tipado do resultado.
 */
import { Avaliacao } from "../domain/avaliacao.types";

/**
 * Motivos possíveis envolvidos no desfecho do fluxo.
 *
 * POR QUE ISSO EXISTE:
 * O fluxo de entrada/retomada da avaliação pode gerar
 * continuidade ou bloqueio por motivos específicos.
 *
 * IMPORTÂNCIA:
 * Esses motivos permitem que camadas superiores saibam
 * por que a avaliação foi continuada ou impedida.
 */
type MotivoFluxoBloqueado =
  | "AVALIACAO_EM_ANDAMENTO"
  | "AVALIACAO_JA_CONCLUIDA"
  | "AVALIACAO_CANCELADA"
  | "TOKEN_JA_UTILIZADO_EM_OUTRO_DISPOSITIVO"
  | "DEVICE_JA_AVALIOU_EVENTO";

/**
 * Contrato final do fluxo de início/retomada da avaliação.
 *
 * POSSIBILIDADES:
 * - criada:
 *   quando uma nova avaliação nasce para o participante
 *
 * - continuada:
 *   quando já existe avaliação em andamento
 *
 * - bloqueada:
 *   quando o fluxo não pode prosseguir por motivo de negócio
 *
 * DECISÃO DE CONTRATO:
 * O resultado sempre carrega a entidade Avaliacao já resolvida,
 * permitindo que as camadas superiores tratem o próximo passo
 * sem precisar refazer buscas.
 */
export type IniciarOuRetomarAvaliacaoResult =
  | {
      acao: "criada";
      avaliacao: Avaliacao;
    }
  | {
      acao: "continuada";
      motivo: "AVALIACAO_EM_ANDAMENTO";
      avaliacao: Avaliacao;
    }
  | {
      acao: "bloqueada";
      motivo: Exclude<MotivoFluxoBloqueado, "AVALIACAO_EM_ANDAMENTO">;
      avaliacao: Avaliacao;
    };
