"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import NavItems from "./NavItems";
import { SoundToggle } from "./SoundToggle";
import { signOut } from "@/app/login/actions";

export default function SideMenuMobile() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha drawer ao mudar de rota
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloqueia scroll do body quando drawer está aberto
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
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-paper border-b border-border z-40 flex items-center justify-between px-4">
        <Link
          href="/"
          className="font-display text-xl font-medium text-ink-deep"
        >
          My Library
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/search"
            aria-label="Buscar"
            className="p-2 rounded-md text-ink-deep hover:bg-paper-soft transition-colors"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            className="p-2 rounded-md text-ink-deep hover:bg-paper-soft transition-colors"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Drawer + backdrop */}
      <div
        className={clsx(
          "lg:hidden fixed inset-0 z-50 transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div
          className="absolute inset-0 bg-ink-deep/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <aside
          className={clsx(
            "absolute top-0 left-0 h-full w-72 bg-paper border-r border-border flex flex-col transform transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full",
          )}
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
          <div className="border-t border-border p-3 space-y-1">
            <SoundToggle />
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
        </aside>
      </div>
    </>
  );
}
