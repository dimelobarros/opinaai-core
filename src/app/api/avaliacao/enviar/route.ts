/**
 * ARQUIVO: src/app/api/avaliacao/enviar/route.ts
 * CAMADA: api
 * MÓDULO: avaliação
 *
 * RESPONSABILIDADE:
 * Receber as respostas enviadas pelo participante e concluir formalmente
 * uma avaliação em andamento.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - recebe o id da avaliação;
 * - recebe a lista de respostas;
 * - recebe o comentário final opcional;
 * - valida o contrato mínimo da requisição;
 * - confirma se a avaliação existe;
 * - bloqueia reenvio de avaliação já concluída;
 * - persiste respostas em transação;
 * - atualiza o comentário final;
 * - marca a avaliação como concluída;
 * - devolve uma resposta JSON estável para a interface.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Esta rota fecha o ato avaliativo no OpinaAi Core.
 * Ela garante que as respostas sejam gravadas de forma consistente e que
 * uma avaliação concluída não possa ser reenviada indevidamente.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Esta rota não executa a entrada antifraude. Ela atua apenas na etapa final
 * de uma avaliação já autorizada, usando repositories reais e transação para
 * evitar persistência parcial.
 */

import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { withTransaction } from "@/shared/infra/database/transaction/with-transaction";
import { AvaliacaoRepository } from "@/modules/avaliacao/infrastructure/avaliacao.repository";
import { RespostaRepository } from "@/modules/resposta/infrastructure/resposta.repository";

/**
 * ======================================================
 * 1. Runtime da rota
 * ======================================================
 *
 * Esta rota usa PostgreSQL e repositories server-side.
 * Na Vercel, ela deve executar em runtime Node.js, não Edge.
 */
export const runtime = "nodejs";

type RespostaInput = {
  perguntaId?: string;
  valor?: number;
  comentario?: string;
};

type EnviarAvaliacaoRequestBody = {
  avaliacaoId?: string;
  respostas?: RespostaInput[];
  comentarioFinal?: string;
};

type EnviarAvaliacaoResponseBody = {
  ok: boolean;
  enviada?: boolean;
  error?: string;
  avaliacaoId?: string;
  quantidadeRespostas?: number;
};

const STATUS_AVALIACAO_CONCLUIDA = "concluida";
const ERRO_AVALIACAO_JA_CONCLUIDA = "AVALIACAO_JA_CONCLUIDA";

/**
 * ======================================================
 * 2. Resposta JSON sem cache
 * ======================================================
 *
 * Centraliza as respostas da rota para garantir que nenhuma
 * resposta dinâmica do envio seja armazenada em cache.
 */
function responderJson(body: EnviarAvaliacaoResponseBody, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

/**
 * ======================================================
 * 3. Leitura segura do body
 * ======================================================
 *
 * Evita que um JSON inválido gere erro técnico exposto
 * diretamente para a interface pública.
 */
async function lerBody(
  request: NextRequest,
): Promise<EnviarAvaliacaoRequestBody | null> {
  try {
    return (await request.json()) as EnviarAvaliacaoRequestBody;
  } catch {
    return null;
  }
}

/**
 * ======================================================
 * 4. Validação das respostas recebidas
 * ======================================================
 *
 * Confirma se cada resposta tem perguntaId e uma nota numérica válida.
 *
 * DECISÃO DE NEGÓCIO:
 * O fluxo atual usa avaliação por estrelas. Por isso, a nota esperada
 * fica entre 1 e 5.
 */
function validarRespostas(respostas: RespostaInput[]) {
  if (respostas.length === 0) {
    return "RESPOSTAS_OBRIGATORIAS";
  }

  const existeRespostaInvalida = respostas.some((resposta) => {
    const perguntaId = String(resposta.perguntaId ?? "").trim();
    const valor = Number(resposta.valor);

    return !perguntaId || !Number.isFinite(valor) || valor < 1 || valor > 5;
  });

  if (existeRespostaInvalida) {
    return "RESPOSTAS_INVALIDAS";
  }

  return null;
}

/**
 * ======================================================
 * 5. POST /api/avaliacao/enviar
 * ======================================================
 *
 * FLUXO:
 * 1. lê e normaliza o body;
 * 2. valida avaliação e respostas;
 * 3. busca a avaliação no banco;
 * 4. bloqueia se já estiver concluída;
 * 5. grava respostas, comentário e status em transação;
 * 6. devolve confirmação estável para a interface.
 */
export async function POST(request: NextRequest) {
  const body = await lerBody(request);

  if (!body) {
    return responderJson(
      {
        ok: false,
        error: "BODY_JSON_INVALIDO",
      },
      400,
    );
  }

  const avaliacaoId = String(body.avaliacaoId ?? "").trim();
  const comentarioFinal = String(body.comentarioFinal ?? "").trim();
  const respostas = Array.isArray(body.respostas) ? body.respostas : [];

  /**
   * ======================================================
   * 6. Validação mínima do contrato HTTP
   * ======================================================
   *
   * Sem avaliacaoId e sem respostas válidas, não há como concluir
   * o ato avaliativo.
   */
  if (!avaliacaoId) {
    return responderJson(
      {
        ok: false,
        error: "AVALIACAO_ID_OBRIGATORIO",
      },
      400,
    );
  }

  const erroRespostas = validarRespostas(respostas);

  if (erroRespostas) {
    return responderJson(
      {
        ok: false,
        error: erroRespostas,
      },
      400,
    );
  }

  try {
    const avaliacaoRepository = new AvaliacaoRepository();
    const respostaRepository = new RespostaRepository();

    /**
     * ======================================================
     * 7. Verificação da avaliação
     * ======================================================
     *
     * Antes de gravar respostas, a rota confirma se a avaliação
     * existe e se ainda pode ser concluída.
     */
    const avaliacao = await avaliacaoRepository.buscarPorId(avaliacaoId);

    if (!avaliacao) {
      return responderJson(
        {
          ok: false,
          error: "AVALIACAO_NAO_ENCONTRADA",
        },
        404,
      );
    }

    /**
     * ======================================================
     * 8. Bloqueio de reenvio
     * ======================================================
     *
     * REGRA DE NEGÓCIO:
     * Uma avaliação já concluída não pode receber novo envio.
     *
     * IMPORTÂNCIA:
     * Esta proteção impede regravação indevida mesmo se o frontend
     * tentar reenviar a requisição.
     */
    if (avaliacao.status === STATUS_AVALIACAO_CONCLUIDA) {
      return responderJson(
        {
          ok: false,
          error: ERRO_AVALIACAO_JA_CONCLUIDA,
        },
        409,
      );
    }

    /**
     * ======================================================
     * 9. Persistência transacional da conclusão
     * ======================================================
     *
     * As respostas, o comentário final e o status da avaliação
     * são persistidos como uma única unidade lógica.
     */
    await withTransaction(async (client) => {
      const agora = new Date().toISOString();

      for (const resposta of respostas) {
        await respostaRepository.criarOuAtualizar(
          {
            id: `resp-${randomUUID()}`,
            avaliacaoId,
            perguntaId: String(resposta.perguntaId ?? "").trim(),
            valor: Number(resposta.valor),
            comentario: String(resposta.comentario ?? "").trim(),
            criadaEm: agora,
            atualizadaEm: agora,
          },
          client,
        );
      }

      await avaliacaoRepository.atualizarComentarioFinal(
        avaliacaoId,
        comentarioFinal,
        agora,
        client,
      );

      await avaliacaoRepository.atualizarStatus(
        avaliacaoId,
        STATUS_AVALIACAO_CONCLUIDA,
        agora,
        client,
      );
    });

    /**
     * ======================================================
     * 10. Resposta final de sucesso
     * ======================================================
     *
     * A interface recebe apenas a confirmação necessária
     * para exibir a tela final de avaliação concluída.
     */
    return responderJson({
      ok: true,
      enviada: true,
      avaliacaoId,
      quantidadeRespostas: respostas.length,
    });
  } catch {
    /**
     * ======================================================
     * 11. Tratamento de erro inesperado
     * ======================================================
     *
     * Falhas de banco, transação ou persistência recebem uma
     * mensagem estável, sem expor detalhes internos ao frontend.
     */
    return responderJson(
      {
        ok: false,
        error: "ERRO_AO_ENVIAR_AVALIACAO",
      },
      500,
    );
  }
}
