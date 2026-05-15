/**
 * ARQUIVO: src/app/api/avaliacao/[avaliacaoId]/perguntas/route.ts
 * CAMADA: api
 * MÓDULO: avaliação
 *
 * RESPONSABILIDADE:
 * Carregar as perguntas ativas vinculadas ao evento de uma avaliação
 * em andamento.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - recebe o id da avaliação pela URL;
 * - localiza a avaliação no banco;
 * - identifica o evento associado à avaliação;
 * - bloqueia o carregamento caso a avaliação já esteja concluída;
 * - busca perguntas ativas do evento;
 * - devolve as perguntas ordenadas para a interface pública;
 * - evita cache de respostas dinâmicas da avaliação.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Esta rota conecta a tela pública da avaliação ao questionário real
 * do evento. Sem ela, o participante não teria como receber as perguntas
 * corretas depois de entrar pelo token.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * O frontend não conhece eventoId, banco de dados ou estrutura interna
 * das perguntas. A avaliação é o ponto de entrada, e esta rota resolve
 * server-side quais perguntas devem ser exibidas.
 */

import { NextRequest, NextResponse } from "next/server";
import { pgPool } from "@/shared/infra/database/connection/postgres";

type RouteContext = {
  params: Promise<{
    avaliacaoId?: string;
  }>;
};

type AvaliacaoRow = {
  evento_id: string;
  status: string;
};

type PerguntaRow = {
  id: string;
  enunciado: string;
  tipo: string;
  ordem: number;
  status: string;
};

type PerguntasResponseBody = {
  ok: boolean;
  motivo?: string;
  perguntas?: PerguntaRow[];
};

const STATUS_AVALIACAO_CONCLUIDA = "concluida";
const MOTIVO_AVALIACAO_JA_CONCLUIDA = "AVALIACAO_JA_CONCLUIDA";

/**
 * ======================================================
 * 1. Resposta JSON sem cache
 * ======================================================
 *
 * Centraliza a criação de respostas da rota para garantir
 * Cache-Control: no-store em todos os cenários.
 *
 * IMPORTÂNCIA:
 * Perguntas e status da avaliação são dados dinâmicos.
 * A rota não deve permitir cache de uma avaliação já respondida
 * ou de um estado anterior do questionário.
 */
function responderJson(body: PerguntasResponseBody, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

/**
 * ======================================================
 * 2. GET /api/avaliacao/[avaliacaoId]/perguntas
 * ======================================================
 *
 * FLUXO:
 * 1. recebe o id da avaliação pela URL;
 * 2. busca evento e status da avaliação;
 * 3. bloqueia avaliações concluídas;
 * 4. carrega perguntas ativas do evento;
 * 5. devolve a lista ordenada para a tela pública.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { avaliacaoId: avaliacaoIdParam } = await context.params;
    const avaliacaoId = String(avaliacaoIdParam ?? "").trim();

    /**
     * ======================================================
     * 3. Validação mínima do parâmetro
     * ======================================================
     *
     * Sem avaliacaoId, a rota não consegue descobrir qual
     * evento deve fornecer as perguntas.
     */
    if (!avaliacaoId) {
      return responderJson(
        {
          ok: false,
          motivo: "AVALIACAO_ID_OBRIGATORIO",
        },
        400,
      );
    }

    /**
     * ======================================================
     * 4. Busca da avaliação
     * ======================================================
     *
     * A tabela avaliacoes guarda o evento_id e o status atual.
     *
     * DECISÃO ARQUITETURAL:
     * A página pública envia apenas o avaliacaoId. O backend usa
     * esse id para descobrir o evento relacionado e proteger o fluxo.
     */
    const avaliacaoResult = await pgPool.query<AvaliacaoRow>(
      `
        SELECT evento_id, status
        FROM avaliacoes
        WHERE id = $1
        LIMIT 1
      `,
      [avaliacaoId],
    );

    const avaliacao = avaliacaoResult.rows[0];

    if (!avaliacao) {
      return responderJson(
        {
          ok: false,
          motivo: "AVALIACAO_NAO_ENCONTRADA",
        },
        404,
      );
    }

    /**
     * ======================================================
     * 5. Bloqueio de avaliação concluída
     * ======================================================
     *
     * REGRA DE NEGÓCIO:
     * Uma avaliação concluída não pode voltar a exibir perguntas.
     *
     * IMPORTÂNCIA:
     * Este bloqueio impede que o participante atualize a página
     * depois do envio e reabra o questionário indevidamente.
     */
    if (avaliacao.status === STATUS_AVALIACAO_CONCLUIDA) {
      return responderJson(
        {
          ok: false,
          motivo: MOTIVO_AVALIACAO_JA_CONCLUIDA,
        },
        409,
      );
    }

    /**
     * ======================================================
     * 6. Busca das perguntas ativas do evento
     * ======================================================
     *
     * Apenas perguntas ativas são exibidas ao participante.
     *
     * DECISÃO DE UX:
     * A ordenação por ordem ASC preserva a sequência definida
     * para o questionário do evento.
     */
    const perguntasResult = await pgPool.query<PerguntaRow>(
      `
        SELECT id, enunciado, tipo, ordem, status
        FROM perguntas
        WHERE evento_id = $1
          AND status = 'ativa'
        ORDER BY ordem ASC
      `,
      [avaliacao.evento_id],
    );

    /**
     * ======================================================
     * 7. Resposta de sucesso
     * ======================================================
     *
     * A interface usa este retorno para montar a sequência
     * de perguntas da avaliação em andamento.
     */
    return responderJson({
      ok: true,
      perguntas: perguntasResult.rows,
    });
  } catch {
    /**
     * ======================================================
     * 8. Tratamento de erro inesperado
     * ======================================================
     *
     * Falhas de banco ou exceções inesperadas recebem uma
     * mensagem estável, sem expor detalhes internos ao frontend.
     */
    return responderJson(
      {
        ok: false,
        motivo: "ERRO_AO_CARREGAR_PERGUNTAS",
      },
      500,
    );
  }
}
