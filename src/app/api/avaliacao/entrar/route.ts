/**
 * ARQUIVO: src/app/api/avaliacao/entrar/route.ts
 * CAMADA: api
 * MÓDULO: avaliação
 *
 * RESPONSABILIDADE:
 * Receber a tentativa pública de entrada do participante no fluxo de avaliação
 * e delegar a decisão antifraude para a camada de aplicação.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - recebe o código do token informado pelo participante;
 * - recebe o fingerprint do dispositivo;
 * - valida o contrato mínimo da requisição;
 * - chama o caso de uso responsável pela entrada na avaliação;
 * - devolve uma resposta JSON para a interface pública;
 * - evita cache de respostas dinâmicas da entrada por token.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Esta rota é a porta HTTP principal do OpinaAi Core.
 * Ela conecta a tela pública de entrada por token ao fluxo antifraude real
 * de criação, retomada ou bloqueio da avaliação.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Esta rota não implementa regra antifraude diretamente.
 * Ela atua como borda HTTP: normaliza entrada, valida contrato mínimo,
 * delega para a Application Layer e serializa uma resposta segura ao frontend.
 */

import { NextRequest, NextResponse } from "next/server";
import { EntrarNaAvaliacaoUseCase } from "@/modules/avaliacao/application/entrar-na-avaliacao.use-case";

type EntradaAvaliacaoRequestBody = {
  codigoToken?: string;
  deviceFingerprint?: string;
};

type EntradaAvaliacaoResponseBody = {
  acao: string;
  motivo: string | null;
  avaliacao: {
    id: string;
  } | null;
};

/**
 * ======================================================
 * 1. Resposta JSON sem cache
 * ======================================================
 *
 * Centraliza a criação de respostas da rota para garantir
 * que todas saiam com Cache-Control: no-store.
 *
 * IMPORTÂNCIA:
 * A entrada por token é uma operação dinâmica e sensível.
 * Ela não deve ser armazenada por cache intermediário.
 */
function responderJson(body: EntradaAvaliacaoResponseBody, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

/**
 * ======================================================
 * 2. Leitura segura do body
 * ======================================================
 *
 * Lê o JSON enviado pela interface e evita que um body inválido
 * gere erro técnico exposto diretamente ao participante.
 */
async function lerBody(
  request: NextRequest,
): Promise<EntradaAvaliacaoRequestBody | null> {
  try {
    return (await request.json()) as EntradaAvaliacaoRequestBody;
  } catch {
    return null;
  }
}

/**
 * ======================================================
 * 3. POST /api/avaliacao/entrar
 * ======================================================
 *
 * FLUXO:
 * 1. lê o body da requisição;
 * 2. normaliza token e fingerprint;
 * 3. valida obrigatoriedade mínima;
 * 4. delega a entrada ao caso de uso principal;
 * 5. devolve a decisão serializada para o frontend.
 */
export async function POST(request: NextRequest) {
  const body = await lerBody(request);

  if (!body) {
    return responderJson(
      {
        acao: "bloqueada",
        motivo: "BODY_JSON_INVALIDO",
        avaliacao: null,
      },
      400,
    );
  }

  const codigoToken = String(body.codigoToken ?? "").trim();
  const deviceFingerprint = String(body.deviceFingerprint ?? "").trim();

  /**
   * ======================================================
   * 4. Validação mínima do contrato HTTP
   * ======================================================
   *
   * Sem token e sem fingerprint, não há como iniciar
   * a tentativa real de entrada na avaliação.
   *
   * DECISÃO ARQUITETURAL:
   * Esta validação é apenas contratual. As regras de negócio,
   * antifraude e estado da avaliação permanecem na Application Layer.
   */
  if (!codigoToken || !deviceFingerprint) {
    return responderJson(
      {
        acao: "bloqueada",
        motivo: "CODIGO_TOKEN_E_DEVICE_FINGERPRINT_OBRIGATORIOS",
        avaliacao: null,
      },
      400,
    );
  }

  try {
    /**
     * ======================================================
     * 5. Delegação para o caso de uso
     * ======================================================
     *
     * O caso de uso executa a lógica real:
     * - validação do token;
     * - validação do dispositivo;
     * - materialização do participante;
     * - criação, retomada ou bloqueio da avaliação.
     */
    const useCase = new EntrarNaAvaliacaoUseCase();
    const resultado = await useCase.execute({
      codigoToken,
      deviceFingerprint,
    });

    const avaliacao =
      "avaliacao" in resultado && resultado.avaliacao
        ? {
            id: resultado.avaliacao.id,
          }
        : null;

    const motivo = "motivo" in resultado ? resultado.motivo : null;
    const status = resultado.acao === "bloqueada" ? 409 : 200;

    /**
     * ======================================================
     * 6. Resposta serializada para o frontend
     * ======================================================
     *
     * A interface pública precisa apenas saber:
     * - qual ação foi decidida;
     * - qual motivo, quando existir;
     * - qual avaliação abrir, quando a entrada for permitida.
     *
     * Por segurança e simplicidade, dados internos como eventoId,
     * participanteEventoId e timestamps não são expostos nesta rota.
     */
    return responderJson(
      {
        acao: resultado.acao,
        motivo,
        avaliacao,
      },
      status,
    );
  } catch (error) {
    /**
     * ======================================================
     * 7. Tratamento de erro da rota
     * ======================================================
     *
     * Erros previstos da camada de aplicação podem ser usados
     * como motivo funcional para a interface.
     *
     * Erros desconhecidos recebem uma mensagem estável.
     */
    const motivo =
      error instanceof Error && error.message
        ? error.message
        : "ERRO_AO_ENTRAR_NA_AVALIACAO";

    return responderJson(
      {
        acao: "bloqueada",
        motivo,
        avaliacao: null,
      },
      400,
    );
  }
}
