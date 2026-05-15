/**
 * ARQUIVO: src/app/layout.tsx
 * CAMADA: ui
 * MÓDULO: aplicação
 *
 * RESPONSABILIDADE:
 * Definir o layout raiz da aplicação OpinaAi no App Router do Next.js.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - importa os estilos globais da aplicação;
 * - define os metadados públicos básicos do sistema;
 * - configura o idioma principal como português do Brasil;
 * - renderiza o conteúdo das páginas dentro da estrutura HTML raiz.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este arquivo é obrigatório no App Router do Next.js e envolve todas
 * as páginas do OpinaAi Core, incluindo a entrada por token e a tela
 * pública de avaliação.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * Este layout não deve conter regra de negócio, acesso a banco,
 * autenticação, dashboard ou dependências de módulos administrativos.
 * Ele deve permanecer simples e compartilhado por toda a aplicação.
 */

import type { Metadata } from "next";
import "./globals.css";

/**
 * ======================================================
 * 1. Metadados públicos da aplicação
 * ======================================================
 *
 * Define título e descrição usados pelo Next.js para a aplicação.
 *
 * DECISÃO DE PRODUTO:
 * A descrição deve refletir o escopo atual do OpinaAi Core:
 * fluxo público de avaliação com proteção antifraude.
 */
export const metadata: Metadata = {
  title: "OpinaAi",
  description: "Sistema de avaliação pública com fluxo antifraude.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

/**
 * ======================================================
 * 2. Layout raiz
 * ======================================================
 *
 * Renderiza a estrutura HTML base da aplicação.
 *
 * IMPORTANTE:
 * O idioma pt-BR deve ser preservado porque a interface atual
 * do OpinaAi está em português brasileiro.
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
