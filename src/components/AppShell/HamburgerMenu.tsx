"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import NavItems from "../SideMenu/NavItems";
import { signOut } from "@/app/login/actions";

/**
 * Hamburger menu da `/library` (botão gold fixo + drawer). Outras rotas
 * continuam usando a sidebar fixa do `<SideMenu>` — esse componente só
 * monta quando `<AppShell>` detecta path `/library*`.
 *
 * Acessibilidade:
 *  - ESC fecha drawer
 *  - Click fora (backdrop) fecha
 *  - Click em item navega + fecha drawer (via `onNavigate` em NavItems)
 *  - Bloqueia scroll do body enquanto aberto
 */
export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha automaticamente ao mudar de rota (caso navegação não venha do drawer).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ESC fecha
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Bloqueia scroll do body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={open}
        className="fixed top-3 left-3 z-30 p-2 rounded-md text-gold hover:bg-ink-deep/40 transition-colors"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-ink-deep"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-paper border-r border-border z-50 shadow-2xl flex flex-col"
              role="navigation"
              aria-label="Menu principal"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <span className="font-display text-[22px] font-medium text-ink-deep">
                  My Library
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar menu"
                  className="p-2 rounded-md text-ink-deep hover:bg-paper-soft transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar">
                <NavItems onNavigate={() => setOpen(false)} />
              </nav>
              <div className="border-t border-border p-3">
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-ink-soft hover:text-ink-deep hover:bg-paper-soft transition-colors duration-150 font-body"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    Sair
                  </button>
                </form>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
