/**
 * ARQUIVO: src/shared/components/page-container/page-container.tsx
 * CAMADA: ui
 * MÓDULO: shared
 *
 * RESPONSABILIDADE:
 * Fornecer um container visual reutilizável para páginas públicas do sistema.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - renderiza a área principal da página;
 * - aplica fundo, cor de texto e altura mínima;
 * - centraliza o conteúdo horizontalmente;
 * - define largura máxima e espaçamentos consistentes;
 * - recebe qualquer conteúdo React por meio de children.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este componente mantém consistência visual entre as telas públicas
 * do OpinaAi Core, especialmente a entrada por token e a tela de avaliação.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este componente é visual e compartilhado.
 * Ele não possui estado, efeitos, handlers, regra de negócio, acesso a API
 * ou dependência de módulos específicos. Por isso, não precisa ser client-side.
 */

import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
};

/**
 * ======================================================
 * 1. Container base de página
 * ======================================================
 *
 * Define a estrutura visual comum para páginas do OpinaAi Core.
 *
 * DECISÃO DE UX:
 * O layout usa fundo claro, largura controlada e espaçamento confortável
 * para preservar legibilidade em telas públicas.
 */
export function PageContainer({ children }: PageContainerProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        {children}
      </div>
    </main>
  );
}
