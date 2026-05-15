/**
 * ARQUIVO: src/app/api/health/db/route.ts
 * CAMADA: api
 * MÓDULO: health
 *
 * RESPONSABILIDADE:
 * Verificar se a aplicação consegue se conectar ao banco PostgreSQL.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - executa uma consulta simples no banco de dados;
 * - confirma se a conexão PostgreSQL está disponível;
 * - devolve uma resposta JSON com o estado da conexão;
 * - evita cache da resposta de health check.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este endpoint ajuda a validar rapidamente se o OpinaAi Core está
 * conectado ao banco real, tanto no servidor atual quanto após a migração
 * para ambiente online.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Esta rota não valida regras de negócio nem dados do domínio.
 * Ela existe apenas como diagnóstico técnico de infraestrutura.
 */

import { NextResponse } from "next/server";
import { pgPool } from "@/shared/infra/database/connection/postgres";

/**
 * ======================================================
 * 1. Runtime da rota
 * ======================================================
 *
 * Esta rota usa conexão PostgreSQL via Node.js.
 * Na Vercel, ela deve executar em runtime Node.js, não Edge.
 */
export const runtime = "nodejs";

type HealthDbResponseBody = {
  ok: boolean;
  database: "connected" | "disconnected";
  now?: string | null;
  error?: string;
};

/**
 * ======================================================
 * 2. Resposta JSON sem cache
 * ======================================================
 *
 * Centraliza a criação da resposta para garantir que o resultado
 * do health check não seja armazenado por cache intermediário.
 */
function responderJson(body: HealthDbResponseBody, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

/**
 * ======================================================
 * 3. GET /api/health/db
 * ======================================================
 *
 * Executa uma consulta mínima no PostgreSQL para confirmar
 * que a aplicação consegue acessar o banco configurado.
 */
export async function GET() {
  try {
    const result = await pgPool.query<{ now: string }>("SELECT NOW() AS now");

    return responderJson({
      ok: true,
      database: "connected",
      now: result.rows[0]?.now ?? null,
    });
  } catch {
    /**
     * ======================================================
     * 4. Falha na conexão
     * ======================================================
     *
     * A rota retorna uma mensagem estável sem expor detalhes internos
     * da conexão, credenciais, host ou configuração do ambiente.
     */
    return responderJson(
      {
        ok: false,
        database: "disconnected",
        error: "ERRO_AO_CONECTAR_BANCO",
      },
      500,
    );
  }
}
