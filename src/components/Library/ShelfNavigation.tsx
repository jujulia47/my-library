import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { ShelfSymbol } from "./ShelfSymbol";
import type { Shelf } from "@/services/libraryData";

type Props = {
  currentId: string;
  allShelves: Shelf[];
};

/**
 * Botões ← → entre estantes consecutivas. Esconde botões nos extremos
 * (primeira/última). Cada botão mostra o símbolo da estante alvo.
 */
export function ShelfNavigation({ currentId, allShelves }: Props) {
  const idx = allShelves.findIndex((s) => s.id === currentId);
  const prev = idx > 0 ? allShelves[idx - 1] : null;
  const next =
    idx >= 0 && idx < allShelves.length - 1 ? allShelves[idx + 1] : null;

  return (
    <div className="flex gap-2">
      {prev ? (
        <Link
          href={`/library/shelf/${prev.id}`}
          aria-label="Estante anterior"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gold/30 hover:border-roasted-chestnut rounded transition-colors"
          style={{ color: "rgba(245, 232, 208, 0.85)" }}
        >
          <ChevronLeftIcon className="w-3.5 h-3.5" />
          <ShelfSymbol symbol={prev.symbol} size={14} />
        </Link>
      ) : (
        <span
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gold/15 rounded opacity-30"
          style={{ color: "rgba(245, 232, 208, 0.85)" }}
          aria-hidden
        >
          <ChevronLeftIcon className="w-3.5 h-3.5" />
        </span>
      )}
      {next ? (
        <Link
          href={`/library/shelf/${next.id}`}
          aria-label="Próxima estante"
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gold/30 hover:border-roasted-chestnut rounded transition-colors"
          style={{ color: "rgba(245, 232, 208, 0.85)" }}
        >
          <ShelfSymbol symbol={next.symbol} size={14} />
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </Link>
      ) : (
        <span
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gold/15 rounded opacity-30"
          style={{ color: "rgba(245, 232, 208, 0.85)" }}
          aria-hidden
        >
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </span>
      )}
    </div>
  );
}
