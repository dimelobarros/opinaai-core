/**
 * ARQUIVO: src/modules/invite-token/application/validar-invite-token.use-case.ts
 * CAMADA: application
 * MÓDULO: invite-token
 *
 * RESPONSABILIDADE:
 * Validar se um invite token pode ser aceito no fluxo antifraude
 * do OpinaAi Core.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - recebe o id interno do invite token;
 * - busca o token persistido no banco;
 * - verifica se o token existe;
 * - verifica se o status está ativo;
 * - verifica se o token ainda está dentro da validade;
 * - retorna uma decisão padronizada para os casos de uso superiores.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este caso de uso é a validação primária do token no fluxo antifraude.
 * Ele impede que tokens inexistentes, inativos, usados, revogados ou expirados
 * avancem para materialização de dispositivo, participante e avaliação.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo não decide avaliação, dispositivo ou participante.
 * Sua responsabilidade é exclusivamente validar a aceitabilidade do invite token.
 */

import { InviteTokenRepository } from "../infrastructure/invite-token.repository";
import { ValidarInviteTokenResult } from "./validar-invite-token.types";

const STATUS_INVITE_TOKEN_ATIVO = "ativo";

const MOTIVO_INVITE_TOKEN_NAO_ENCONTRADO = "INVITE_TOKEN_NAO_ENCONTRADO";
const MOTIVO_INVITE_TOKEN_STATUS_INVALIDO = "INVITE_TOKEN_STATUS_INVALIDO";
const MOTIVO_INVITE_TOKEN_EXPIRADO = "INVITE_TOKEN_EXPIRADO";

export class ValidarInviteTokenUseCase {
  /**
   * ======================================================
   * 1. Dependência de persistência
   * ======================================================
   *
   * O repository recupera o estado real do invite token.
   *
   * DECISÃO ARQUITETURAL:
   * A validação deve usar o estado persistido no banco, não dados
   * vindos da interface ou estruturas mockadas.
   */
  constructor(private repository = new InviteTokenRepository()) {}

  /**
   * ======================================================
   * 2. Validação do invite token
   * ======================================================
   *
   * FLUXO:
   * 1. normaliza o id recebido;
   * 2. busca o token persistido;
   * 3. falha se o token não existir;
   * 4. falha se o status não for ativo;
   * 5. falha se o token estiver expirado;
   * 6. retorna válido se passar em todas as verificações.
   */
  async execute(inviteTokenId: string): Promise<ValidarInviteTokenResult> {
    const inviteTokenIdNormalizado = inviteTokenId.trim();

    /**
     * ======================================================
     * 3. Busca do token persistido
     * ======================================================
     *
     * Sem token localizado no banco, não existe entrada legítima
     * para o fluxo público de avaliação.
     */
    const inviteToken = inviteTokenIdNormalizado
      ? await this.repository.buscarPorId(inviteTokenIdNormalizado)
      : null;

    /**
     * ======================================================
     * 4. Token inexistente
     * ======================================================
     *
     * Um id vazio ou inexistente é tratado como token não encontrado.
     *
     * DECISÃO DE CONTRATO:
     * Mantemos o motivo já existente para evitar alteração no tipo
     * ValidarInviteTokenResult sem auditar o arquivo de types.
     */
    if (!inviteToken) {
      return {
        valido: false,
        motivo: MOTIVO_INVITE_TOKEN_NAO_ENCONTRADO,
      };
    }

    /**
     * ======================================================
     * 5. Status inválido
     * ======================================================
     *
     * Apenas tokens ativos podem seguir no fluxo.
     * Tokens usados, expirados, revogados ou em qualquer outro status
     * são bloqueados aqui.
     */
    if (inviteToken.status !== STATUS_INVITE_TOKEN_ATIVO) {
      return {
        valido: false,
        motivo: MOTIVO_INVITE_TOKEN_STATUS_INVALIDO,
      };
    }

    /**
     * ======================================================
     * 6. Verificação de expiração
     * ======================================================
     *
     * Mesmo ativo, o token precisa estar dentro da janela temporal
     * de validade.
     *
     * REGRA:
     * Se a data de expiração for inválida ou menor/igual ao momento
     * atual, o token não pode continuar no fluxo.
     */
    const agora = new Date();
    const expiraEm = new Date(inviteToken.expiraEm);
    const timestampExpiracao = expiraEm.getTime();

    if (
      Number.isNaN(timestampExpiracao) ||
      timestampExpiracao <= agora.getTime()
    ) {
      return {
        valido: false,
        motivo: MOTIVO_INVITE_TOKEN_EXPIRADO,
      };
    }

    /**
     * ======================================================
     * 7. Token aceito
     * ======================================================
     *
     * Se o token existe, está ativo e não expirou, ele pode
     * continuar no fluxo antifraude.
     */
    return {
      valido: true,
      inviteToken,
    };
  }
}
