"use client";

/**
 * ARQUIVO: src/modules/avaliacao/components/star-rating.tsx
 * CAMADA: ui
 * MÓDULO: avaliação
 *
 * RESPONSABILIDADE:
 * Renderizar o controle visual de avaliação por estrelas.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - exibe uma escala visual de 1 a 5 estrelas;
 * - mostra destaque visual ao passar o mouse sobre as estrelas;
 * - informa ao componente pai qual nota foi selecionada;
 * - respeita estado desabilitado durante carregamentos;
 * - oferece atributos básicos de acessibilidade para leitura da nota.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este componente é usado pela tela pública da avaliação para coletar
 * a resposta numérica do participante em perguntas de escala.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este arquivo não persiste respostas nem decide regras de avaliação.
 * Ele apenas representa a interação visual da nota e delega o valor
 * selecionado para o componente pai por meio de onChange.
 */

import { useState } from "react";

type StarRatingProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

const ESTRELAS = [1, 2, 3, 4, 5];

/**
 * ======================================================
 * 1. Componente de avaliação por estrelas
 * ======================================================
 *
 * Renderiza uma escala simples de 1 a 5.
 *
 * DECISÃO DE UX:
 * O hover antecipa visualmente a nota antes do clique, tornando
 * a interação mais clara para o participante.
 */
export function StarRating({
  value,
  onChange,
  disabled = false,
}: StarRatingProps) {
  /**
   * Valor temporário usado apenas durante o hover.
   *
   * IMPORTANTE:
   * O valor definitivo continua vindo da prop value.
   * O hover não persiste resposta sozinho.
   */
  const [hoverValue, setHoverValue] = useState(0);

  const estrelasAtivas = hoverValue || value;

  /**
   * ======================================================
   * 2. Seleção de estrela
   * ======================================================
   *
   * Quando o componente está desabilitado, nenhuma nova seleção
   * deve ser enviada ao componente pai.
   */
  const selecionarEstrela = (estrela: number) => {
    if (disabled) {
      return;
    }

    onChange(estrela);
  };

  return (
    <div
      className="flex items-center gap-2"
      onMouseLeave={() => setHoverValue(0)}
      role="radiogroup"
      aria-label="Nota da avaliação"
    >
      {ESTRELAS.map((estrela) => {
        const ativa = estrela <= estrelasAtivas;

        return (
          <button
            key={estrela}
            type="button"
            disabled={disabled}
            onMouseEnter={() => {
              if (!disabled) {
                setHoverValue(estrela);
              }
            }}
            onClick={() => selecionarEstrela(estrela)}
            className={`text-4xl leading-none transition ${
              disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            } ${ativa ? "text-amber-400" : "text-slate-300"}`}
            aria-label={`${estrela} estrela${estrela > 1 ? "s" : ""}`}
            aria-checked={value === estrela}
            role="radio"
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
