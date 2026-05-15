/**
 * ARQUIVO: src/app/page.tsx
 * CAMADA: ui
 * MÓDULO: aplicação
 *
 * RESPONSABILIDADE:
 * Definir a rota inicial pública do OpinaAi Core.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * - recebe acessos à raiz da aplicação;
 * - redireciona o usuário para a entrada pública da avaliação;
 * - remove a dependência da antiga home estrutural com links administrativos;
 * - mantém o ponto inicial alinhado ao fluxo funcional validado.
 *
 * IMPORTÂNCIA NO SISTEMA:
 * Este arquivo garante que a primeira versão publicada no GitHub/Vercel
 * comece pelo fluxo real em uso: entrada por token e avaliação pública.
 *
 * OBSERVAÇÃO ARQUITETURAL:
 * O OpinaAi Core não expõe dashboard, páginas administrativas ou módulos
 * mockados nesta primeira migração. A raiz da aplicação deve apontar para
 * /entrar-avaliacao, que é o ponto de entrada funcional do produto atual.
 */

import { redirect } from "next/navigation";

/**
 * ======================================================
 * 1. Redirecionamento da rota raiz
 * ======================================================
 *
 * A home pública do OpinaAi Core não é um dashboard.
 * O sistema começa na entrada da avaliação por token.
 */
export default function HomePage() {
  redirect("/entrar-avaliacao");
}
