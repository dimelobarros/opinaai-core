"use client";

/**
 * ARQUIVO: src/app/entrar-avaliacao/page.tsx
 * CAMADA: ui
 * MÓDULO: avaliação
 *
 * RESPONSABILIDADE:
 * Renderizar a tela pública de entrada da avaliação e enviar o token
 * informado pelo usuário para o fluxo antifraude server-side.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - renderiza a tela de entrada da avaliação;
 * - captura o token informado pelo usuário;
 * - gera um fingerprint simples do dispositivo;
 * - envia token e fingerprint para /api/avaliacao/entrar;
 * - interpreta a decisão retornada pelo backend;
 * - redireciona o usuário para a avaliação quando a entrada é autorizada;
 * - exibe mensagens claras quando a entrada é bloqueada ou falha.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este arquivo é o ponto de entrada visual do OpinaAi Core.
 * Ele inicia o fluxo público validado de avaliação por token, sem depender
 * de dashboard, páginas administrativas ou módulos mockados.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Esta tela não executa regras de negócio antifraude. O frontend apenas
 * coleta dados mínimos, envia para a API e respeita a decisão do backend.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/shared/components/page-container/page-container";

type EntradaAvaliacaoResultado = {
  acao?: "criada" | "continuada" | "bloqueada";
  motivo?: string;
  error?: string;
  avaliacao?: {
    id?: string;
  };
};

const MENSAGEM_INICIAL = "Digite o token para entrar.";

/**
 * ======================================================
 * 1. Fingerprint do dispositivo
 * ======================================================
 *
 * Gera um identificador simples a partir de características
 * disponíveis no navegador.
 *
 * IMPORTANTE:
 * Este fingerprint não prova identidade física absoluta.
 * Ele é apenas um sinal técnico usado pelo backend dentro
 * da estratégia antifraude atual.
 */
function gerarFingerprint() {
  if (typeof window === "undefined") {
    return "fp-server-side";
  }

  const dados = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    String(new Date().getTimezoneOffset()),
    navigator.platform,
    navigator.hardwareConcurrency
      ? String(navigator.hardwareConcurrency)
      : "hc-unknown",
    navigator.maxTouchPoints ? String(navigator.maxTouchPoints) : "mtp-unknown",
  ];

  return btoa(dados.join("|"));
}

export default function EntrarAvaliacaoPage() {
  /**
   * ======================================================
   * 2. Estados da tela
   * ======================================================
   *
   * Mantêm o token digitado, a mensagem exibida ao usuário
   * e o estado de carregamento da ação de entrada.
   */
  const [codigoToken, setCodigoToken] = useState("");
  const [mensagem, setMensagem] = useState(MENSAGEM_INICIAL);
  const [carregando, setCarregando] = useState(false);

  /**
   * Router usado apenas para navegação após autorização
   * da entrada pelo backend.
   */
  const router = useRouter();

  /**
   * ======================================================
   * 3. Entrada no fluxo de avaliação
   * ======================================================
   *
   * FLUXO:
   * 1. valida se há token preenchido;
   * 2. envia token normalizado e fingerprint para a API;
   * 3. interpreta a resposta do backend;
   * 4. redireciona ou exibe a mensagem adequada.
   *
   * DECISÃO ARQUITETURAL:
   * A UI não decide se a avaliação pode ser criada,
   * retomada ou bloqueada. Essa decisão pertence à API.
   */
  const handleEntrar = async () => {
    const tokenNormalizado = codigoToken.trim();

    if (!tokenNormalizado) {
      setMensagem(MENSAGEM_INICIAL);
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch("/api/avaliacao/entrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigoToken: tokenNormalizado,
          deviceFingerprint: gerarFingerprint(),
        }),
      });

      const resultado = (await response.json()) as EntradaAvaliacaoResultado;

      if (!response.ok) {
        setMensagem(
          resultado.error ??
            resultado.motivo ??
            "Não foi possível entrar na avaliação.",
        );
        return;
      }

      if (resultado.acao === "criada" || resultado.acao === "continuada") {
        if (!resultado.avaliacao?.id) {
          setMensagem(
            "A entrada foi autorizada, mas não foi possível localizar a avaliação.",
          );
          return;
        }

        router.push(`/avaliacao/${resultado.avaliacao.id}`);
        return;
      }

      if (resultado.acao === "bloqueada") {
        setMensagem(
          resultado.motivo ??
            "Avaliação já concluída ou indisponível para este dispositivo.",
        );
        return;
      }

      setMensagem("Não foi possível iniciar a avaliação.");
    } catch {
      setMensagem("Erro inesperado ao entrar na avaliação. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  /**
   * ======================================================
   * 4. Renderização da interface
   * ======================================================
   *
   * A tela é propositalmente simples para reduzir fricção:
   * o usuário informa o token, aciona a entrada e recebe
   * feedback imediato do sistema.
   */
  return (
    <PageContainer>
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Entrar na avaliação
          </h1>

          <p className="text-base leading-7 text-slate-600">
            Digite o token fornecido para iniciar sua avaliação.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-6">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="codigoToken"
          >
            Token
          </label>

          <input
            id="codigoToken"
            name="codigoToken"
            type="text"
            value={codigoToken}
            onChange={(event) => setCodigoToken(event.target.value)}
            placeholder="Ex.: HTMLSEM2025-ENTRADA-001"
            autoComplete="off"
            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
          />

          <button
            type="button"
            onClick={handleEntrar}
            disabled={carregando || !codigoToken.trim()}
            className="rounded-xl bg-slate-900 px-4 py-3 text-white disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {mensagem}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
