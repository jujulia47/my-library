import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

type Props = {
  totalBooks: number;
  totalShelves: number;
};

export function LibraryHeader({ totalBooks, totalShelves }: Props) {
  return (
    <header className="flex justify-between items-end mb-8 pb-4 border-b border-gold/20">
      <div>
        <h1
          className="font-display text-2xl font-medium leading-none"
          style={{ color: "var(--color-paper-aged)" }}
        >
          Minha biblioteca
        </h1>
        <p
          className="text-sm italic mt-1"
          style={{ color: "rgba(245, 232, 208, 0.65)" }}
        >
          {totalBooks} {totalBooks === 1 ? "livro" : "livros"} ·{" "}
          {totalShelves} {totalShelves === 1 ? "estante" : "estantes"}
        </p>
      </div>
      <Link
        href="/"
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gold/30 hover:border-gold rounded transition-colors"
        style={{ color: "rgba(245, 232, 208, 0.85)" }}
      >
        <ChevronLeftIcon className="w-3.5 h-3.5" />
        Voltar pra home
      </Link>
    </header>
  );
}
