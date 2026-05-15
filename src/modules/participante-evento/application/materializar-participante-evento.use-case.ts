/**
 * ARQUIVO: src/modules/participante-evento/application/materializar-participante-evento.use-case.ts
 * CAMADA: application
 * MÓDULO: participante-evento
 *
 * RESPONSABILIDADE:
 * Garantir a existência do participante materializado dentro de um evento
 * a partir da combinação antifraude validada.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - recebe eventoId, inviteTokenId e deviceSessionId;
 * - normaliza e valida os identificadores mínimos;
 * - verifica se já existe participante para a combinação antifraude;
 * - reutiliza o participante existente quando encontrado;
 * - cria um novo participante materializado quando ainda não existe registro;
 * - devolve o participante_evento usado como dono da avaliação.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este caso de uso consolida a identidade anônima do participante dentro
 * do evento. Ele é essencial para o OpinaAi Core porque a avaliação não
 * pertence diretamente ao token nem ao dispositivo, mas sim ao participante
 * materializado no evento.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo não valida token, não valida device session e não decide
 * criação ou bloqueio de avaliação. Ele assume que essas etapas anteriores
 * já foram resolvidas e apenas garante o vínculo participante_evento.
 */

import { randomUUID } from "node:crypto";
import { ParticipanteEvento } from "../domain/participante-evento.types";
import { ParticipanteEventoRepository } from "../infrastructure/participante-evento.repository";

type MaterializarParticipanteEventoParams = {
  eventoId: string;
  inviteTokenId: string;
  deviceSessionId: string;
};

const STATUS_PARTICIPANTE_EVENTO_ATIVO = "ativo";

const MOTIVO_EVENTO_ID_OBRIGATORIO = "EVENTO_ID_OBRIGATORIO";
const MOTIVO_INVITE_TOKEN_ID_OBRIGATORIO = "INVITE_TOKEN_ID_OBRIGATORIO";
const MOTIVO_DEVICE_SESSION_ID_OBRIGATORIO = "DEVICE_SESSION_ID_OBRIGATORIO";

export class MaterializarParticipanteEventoUseCase {
  /**
   * ======================================================
   * 1. Dependência de persistência
   * ======================================================
   *
   * O repository recupera ou grava o participante_evento
   * na infraestrutura real de banco de dados.
   *
   * DECISÃO ARQUITETURAL:
   * A materialização deve usar o banco real, pois este vínculo
   * é parte central da proteção antifraude.
   */
  constructor(private repository = new ParticipanteEventoRepository()) {}

  /**
   * ======================================================
   * 2. Materialização do participante do evento
   * ======================================================
   *
   * FLUXO:
   * 1. normaliza eventoId, inviteTokenId e deviceSessionId;
   * 2. valida os identificadores obrigatórios;
   * 3. busca participante existente pela combinação antifraude;
   * 4. reutiliza o participante quando ele já existe;
   * 5. cria um novo participante quando ainda não existe registro.
   *
   * REGRA ARQUITETURAL:
   * A avaliação deve se vincular ao participante_evento.
   * Isso evita tratar token ou dispositivo como donos diretos
   * do ato avaliativo.
   */
  async execute(
    params: MaterializarParticipanteEventoParams,
  ): Promise<ParticipanteEvento> {
    const eventoId = params.eventoId.trim();
    const inviteTokenId = params.inviteTokenId.trim();
    const deviceSessionId = params.deviceSessionId.trim();

    /**
     * ======================================================
     * 3. Validação mínima dos identificadores
     * ======================================================
     *
     * A materialização exige as três chaves centrais do antifraude:
     * evento, invite token e sessão técnica do dispositivo.
     */
    if (!eventoId) {
      throw new Error(MOTIVO_EVENTO_ID_OBRIGATORIO);
    }

    if (!inviteTokenId) {
      throw new Error(MOTIVO_INVITE_TOKEN_ID_OBRIGATORIO);
    }

    if (!deviceSessionId) {
      throw new Error(MOTIVO_DEVICE_SESSION_ID_OBRIGATORIO);
    }

    /**
     * ======================================================
     * 4. Busca por participante já materializado
     * ======================================================
     *
     * A combinação eventoId + inviteTokenId + deviceSessionId
     * representa a identidade antifraude materializada no evento.
     *
     * IMPORTÂNCIA:
     * Reutilizar o participante existente preserva continuidade
     * e evita duplicidade indevida no fluxo.
     */
    const participanteExistente =
      await this.repository.buscarPorChavesAntifraude(
        eventoId,
        inviteTokenId,
        deviceSessionId,
      );

    if (participanteExistente) {
      return participanteExistente;
    }

    /**
     * ======================================================
     * 5. Criação do participante materializado
     * ======================================================
     *
     * Se ainda não existe participante para a combinação validada,
     * o sistema cria o registro que será usado como dono da avaliação.
     */
    const agora = new Date().toISOString();

    return this.repository.criar({
      id: this.gerarId(),
      eventoId,
      inviteTokenId,
      deviceSessionId,
      status: STATUS_PARTICIPANTE_EVENTO_ATIVO,
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }

  /**
   * ======================================================
   * 6. Geração do identificador do participante_evento
   * ======================================================
   *
   * Mantém o prefixo pe para legibilidade operacional e usa
   * randomUUID para reduzir risco de colisão.
   */
  private gerarId(): string {
    return `pe-${randomUUID()}`;
  }
}
