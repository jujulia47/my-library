"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import SideMenu from "./SideMenu";
import TopBar from "./Layout/TopBar";
import { HamburgerMenu } from "./AppShell/HamburgerMenu";

type Props = {
  children: ReactNode;
  /**
   * Páginas full-width (ex.: /library com parede). Quando true, remove o
   * wrapper `max-w-6xl mx-auto px-6 py-8` — children renderiza direto no
   * `<main>`.
   */
  fullBleed?: boolean;
};

/**
 * Sessão 17.7.5: regressão do 17.7 corrigida. Hamburger menu volta a ser
 * exclusivo da `/library` (e suas subrotas). Demais páginas mantêm a sidebar
 * fixa + topbar com busca como era pré-17.7.
 *
 * `usePathname()` exige client component. Children continuam podendo ser
 * server components — props serializáveis atravessam o limite normalmente.
 */
export default function AppShell({ children, fullBleed = false }: Props) {
  const pathname = usePathname() ?? "";
  const isLibrary =
    pathname === "/library" || pathname.startsWith("/library/");

  if (isLibrary) {
    return (
      <div className="min-h-screen bg-ivory text-ink-deep">
        <HamburgerMenu />
        <main className="min-h-screen">
          {fullBleed ? (
            children
          ) : (
            <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory text-ink-deep">
      <SideMenu />
      <TopBar />
      <main className="lg:ml-60 pt-14">
        {fullBleed ? (
          children
        ) : (
          <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
        )}
      </main>
    </div>
  );
}
