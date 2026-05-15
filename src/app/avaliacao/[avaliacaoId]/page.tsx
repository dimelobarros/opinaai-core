"use client";

/**
 * ARQUIVO: src/app/avaliacao/[avaliacaoId]/page.tsx
 * CAMADA: ui
 * MÓDULO: avaliação
 *
 * RESPONSABILIDADE:
 * Renderizar a tela pública de resposta da avaliação, carregar perguntas
 * e enviar as respostas do participante para conclusão.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - lê o identificador da avaliação a partir da URL;
 * - carrega as perguntas vinculadas à avaliação;
 * - controla a navegação sequencial entre perguntas;
 * - coleta respostas por estrelas;
 * - permite comentário final opcional;
 * - envia respostas para /api/avaliacao/enviar;
 * - mantém a tela travada em estado final quando a avaliação já foi concluída.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este arquivo é a principal tela pública do OpinaAi Core.
 * É nele que o participante realiza o ato avaliativo validado pelo fluxo
 * antifraude iniciado na entrada por token.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Esta página não acessa banco de dados nem repositories diretamente.
 * Toda regra sensível, persistência, validação antifraude e bloqueio de
 * reenvio ficam nas rotas server-side da API.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StarRating } from "@/modules/avaliacao/components/star-rating";
import { PageContainer } from "@/shared/components/page-container/page-container";

type Pergunta = {
  id: string;
  enunciado: string;
  tipo: string;
  ordem: number;
  status: string;
};

type PerguntasApiResponse = {
  ok?: boolean;
  motivo?: string;
  error?: string;
  perguntas?: Pergunta[];
};

type EnviarAvaliacaoApiResponse = {
  enviada?: boolean;
  motivo?: string;
  error?: string;
};

const ERRO_AVALIACAO_JA_CONCLUIDA = "AVALIACAO_JA_CONCLUIDA";

/**
 * ======================================================
 * 1. Normalização do parâmetro da rota
 * ======================================================
 *
 * O Next.js pode retornar parâmetros dinâmicos como string
 * ou array de strings. Para este fluxo, a avaliação sempre
 * deve ser tratada como um identificador único.
 */
function normalizarParametro(valor: string | string[] | undefined) {
  if (Array.isArray(valor)) {
    return valor[0] ?? "";
  }

  return valor ?? "";
}

export default function AvaliacaoPage() {
  const params = useParams<{ avaliacaoId?: string | string[] }>();
  const avaliacaoId = normalizarParametro(params.avaliacaoId);

  /**
   * ======================================================
   * 2. Estados da avaliação
   * ======================================================
   *
   * Controlam perguntas carregadas, posição atual no fluxo,
   * respostas locais, comentário final, mensagens e estados
   * de carregamento da interface.
   */
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [comentario, setComentario] = useState("");
  const [mensagem, setMensagem] = useState(
    "Carregando perguntas da avaliação...",
  );
  const [carregando, setCarregando] = useState(false);
  const [carregandoPerguntas, setCarregandoPerguntas] = useState(true);
  const [avaliacaoConcluida, setAvaliacaoConcluida] = useState(false);

  /**
   * ======================================================
   * 3. Carregamento das perguntas da avaliação
   * ======================================================
   *
   * A página usa o avaliacaoId para pedir ao backend as perguntas
   * do evento associado à avaliação.
   *
   * DECISÃO ARQUITETURAL:
   * O frontend não recebe eventoId diretamente. A API resolve
   * essa relação a partir da avaliação existente.
   *
   * REGRA DE PROTEÇÃO:
   * Se a API informar que a avaliação já foi concluída,
   * a tela não deve reabrir o questionário.
   */
  useEffect(() => {
    const carregarPerguntas = async () => {
      if (!avaliacaoId) {
        setMensagem("Não foi possível identificar a avaliação.");
        setCarregandoPerguntas(false);
        return;
      }

      try {
        const response = await fetch(`/api/avaliacao/${avaliacaoId}/perguntas`);
        const resultado = (await response.json()) as PerguntasApiResponse;

        if (
          resultado?.motivo === ERRO_AVALIACAO_JA_CONCLUIDA ||
          resultado?.error === ERRO_AVALIACAO_JA_CONCLUIDA
        ) {
          setAvaliacaoConcluida(true);
          setPerguntas([]);
          setMensagem(
            "Esta avaliação já foi concluída. Obrigado pela sua participação.",
          );
          setCarregandoPerguntas(false);
          return;
        }

        if (!response.ok || !resultado.ok) {
          setMensagem(
            resultado?.motivo ??
              resultado?.error ??
              "Não foi possível carregar as perguntas.",
          );
          setCarregandoPerguntas(false);
          return;
        }

        setPerguntas(resultado.perguntas ?? []);
        setMensagem("Avalie cada pergunta com estrelas.");
      } catch {
        setMensagem("Erro inesperado ao carregar as perguntas da avaliação.");
      } finally {
        setCarregandoPerguntas(false);
      }
    };

    carregarPerguntas();
  }, [avaliacaoId]);

  const totalPerguntas = perguntas.length;
  const estaNaEtapaComentario =
    totalPerguntas > 0 && indiceAtual >= totalPerguntas;
  const perguntaAtual = perguntas[indiceAtual];

  /**
   * ======================================================
   * 4. Seleção de nota
   * ======================================================
   *
   * Salva a nota escolhida para a pergunta atual e avança
   * automaticamente para a próxima etapa.
   *
   * DECISÃO DE UX:
   * O avanço automático reduz atrito e deixa o fluxo mais simples
   * para o participante.
   */
  const selecionarEstrelas = (valor: number) => {
    if (!perguntaAtual) {
      return;
    }

    setRespostas((estadoAtual) => ({
      ...estadoAtual,
      [perguntaAtual.id]: valor,
    }));

    setMensagem("");

    setTimeout(() => {
      setIndiceAtual((estadoAtual) => estadoAtual + 1);
    }, 250);
  };

  /**
   * ======================================================
   * 5. Retorno de etapa
   * ======================================================
   *
   * Permite que o participante revise a pergunta anterior
   * ou retorne da etapa de comentário final.
   */
  const voltarEtapa = () => {
    if (indiceAtual === 0) {
      return;
    }

    setIndiceAtual((estadoAtual) => estadoAtual - 1);
    setMensagem("");
  };

  /**
   * ======================================================
   * 6. Envio da avaliação
   * ======================================================
   *
   * Monta o payload final com respostas e comentário opcional,
   * envia para a API e interpreta o resultado.
   *
   * REGRA DE PROTEÇÃO:
   * Se o backend informar que a avaliação já foi concluída,
   * a interface permanece em estado final e não reabre perguntas.
   */
  const handleEnviar = async () => {
    if (!avaliacaoId) {
      setMensagem("Não foi possível identificar a avaliação.");
      return;
    }

    if (perguntas.length === 0) {
      setMensagem("Nenhuma pergunta foi carregada.");
      return;
    }

    const existePerguntaSemResposta = perguntas.some(
      (pergunta) => !respostas[pergunta.id],
    );

    if (existePerguntaSemResposta) {
      setMensagem("Responda todas as perguntas antes de concluir a avaliação.");
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch("/api/avaliacao/enviar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avaliacaoId,
          respostas: perguntas.map((pergunta) => ({
            perguntaId: pergunta.id,
            valor: respostas[pergunta.id],
            comentario: "",
          })),
          comentarioFinal: comentario.trim(),
        }),
      });

      const resultado = (await response.json()) as EnviarAvaliacaoApiResponse;

      if (
        resultado?.error === ERRO_AVALIACAO_JA_CONCLUIDA ||
        resultado?.motivo === ERRO_AVALIACAO_JA_CONCLUIDA
      ) {
        setAvaliacaoConcluida(true);
        setPerguntas([]);
        setMensagem(
          "Esta avaliação já foi concluída. Obrigado pela sua participação.",
        );
        return;
      }

      if (!response.ok) {
        setMensagem(
          resultado.error ??
            resultado.motivo ??
            "Não foi possível concluir a avaliação.",
        );
        return;
      }

      if (resultado.enviada) {
        setAvaliacaoConcluida(true);
        setMensagem(
          "Avaliação concluída com sucesso. Obrigado pela sua participação.",
        );
        return;
      }

      setMensagem("Não foi possível concluir a avaliação.");
    } catch {
      setMensagem("Erro inesperado ao enviar a avaliação. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  /**
   * ======================================================
   * 7. Indicadores de progresso
   * ======================================================
   *
   * Mostram ao participante em qual etapa do fluxo ele está,
   * considerando perguntas e comentário final.
   */
  const progressoAtual =
    totalPerguntas === 0 ? 0 : Math.min(indiceAtual + 1, totalPerguntas + 1);
  const progressoTotal = totalPerguntas + 1;

  /**
   * ======================================================
   * 8. Renderização da interface
   * ======================================================
   *
   * A tela alterna entre:
   * - carregamento inicial;
   * - avaliação já concluída;
   * - ausência de perguntas;
   * - resposta das perguntas;
   * - comentário final.
   */
  return (
    <PageContainer>
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Avaliação</h1>

          <p className="text-base leading-7 text-slate-600">
            Responda uma pergunta por vez usando estrelas. Ao final, você poderá
            deixar um comentário opcional.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-6">
          {carregandoPerguntas ? (
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {mensagem}
            </div>
          ) : avaliacaoConcluida ? (
            <div className="flex flex-col gap-4 text-center">
              <div className="text-6xl">✅</div>

              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Avaliação concluída
                </h2>

                <p className="text-base leading-7 text-slate-600">
                  Obrigado pela sua participação.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {mensagem}
              </div>
            </div>
          ) : perguntas.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {mensagem}
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="text-sm font-medium text-slate-600">
                  Etapa {progressoAtual} de {progressoTotal}
                </div>

                <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all"
                    style={{
                      width: `${(progressoAtual / progressoTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {estaNaEtapaComentario ? (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                      Comentário final
                    </h2>

                    <p className="text-base leading-7 text-slate-600">
                      Este campo é opcional. Se quiser, deixe um comentário
                      sobre a experiência geral.
                    </p>
                  </div>

                  <textarea
                    value={comentario}
                    onChange={(event) => setComentario(event.target.value)}
                    placeholder="Escreva aqui seu comentário (opcional)..."
                    rows={5}
                    className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                  />

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={voltarEtapa}
                      disabled={carregando}
                      className="rounded-xl border border-slate-300 px-4 py-3 text-slate-700 disabled:opacity-60"
                    >
                      Voltar
                    </button>

                    <button
                      type="button"
                      onClick={handleEnviar}
                      disabled={carregando}
                      className="rounded-xl bg-slate-900 px-4 py-3 text-white disabled:opacity-60"
                    >
                      {carregando ? "Enviando..." : "Concluir avaliação"}
                    </button>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {mensagem}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <div className="text-sm font-medium text-slate-500">
                      Pergunta {indiceAtual + 1}
                    </div>

                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                      {perguntaAtual?.enunciado}
                    </h2>

                    <p className="text-base leading-7 text-slate-600">
                      Toque ou clique em uma estrela para selecionar sua nota.
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-4 rounded-2xl bg-slate-50 px-6 py-6">
                    <StarRating
                      value={respostas[perguntaAtual?.id ?? ""] ?? 0}
                      onChange={selecionarEstrelas}
                      disabled={carregando}
                    />

                    <div className="text-sm text-slate-600">
                      {perguntaAtual && respostas[perguntaAtual.id]
                        ? `Você selecionou ${respostas[perguntaAtual.id]} estrela(s).`
                        : "Nenhuma estrela selecionada ainda."}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={voltarEtapa}
                      disabled={indiceAtual === 0 || carregando}
                      className="rounded-xl border border-slate-300 px-4 py-3 text-slate-700 disabled:opacity-60"
                    >
                      Voltar
                    </button>

                    <div className="text-sm text-slate-500">
                      A próxima pergunta aparecerá automaticamente após sua
                      escolha.
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {mensagem}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
