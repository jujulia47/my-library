"use client";

import { usePathname } from "next/navigation";
import GlobalSearch from "../Layout/GlobalSearch";

/**
 * Sessão 17.7: TopBar com busca global, oculto no `/library` pra preservar
 * a imersão da parede de prateleiras. Outras páginas mantêm a barra de busca
 * acessível no topo.
 *
 * Quando visível, injeta padding-top no `<body>` via spacer h-14 (renderizado
 * inline) — assim páginas comuns continuam respirando abaixo do topbar e o
 * /library aproveita a viewport inteira sem padding ghost.
 *
 * `pl-16` no header reserva espaço pra o botão hamburger fixo (top-left, w-10).
 */
export function ConditionalTopBar() {
  const pathname = usePathname();
  const hideTopBar =
    pathname === "/library" || pathname.startsWith("/library/");

  if (hideTopBar) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 bg-paper border-b border-border z-30 flex items-center pl-16 pr-4">
        <GlobalSearch />
      </header>
      {/* Spacer pra empurrar conteúdo abaixo do topbar fixo */}
      <div className="h-14" aria-hidden />
    </>
  );
}
