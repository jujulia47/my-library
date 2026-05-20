"use client";

import { BookSpine } from "./BookSpine";
import type { ShelfBook } from "@/services/libraryData";

type Props = {
  books: ShelfBook[];
  onSpineClick?: (book: ShelfBook, rect: DOMRect) => void;
};

/**
 * Seção "Sem estante" no fim do mural — lista livros físicos do acervo
 * (owned/lent_out + formats_owned contém physical) que ainda não foram
 * atribuídos a uma estante (`shelf_id IS NULL`). Lombadas draggable: o
 * usuário arrasta pra qualquer estante real pra populá-la, ou usa o
 * botão "Reorganizar biblioteca" no header (`LibraryWall`) que distribui
 * tudo de uma vez.
 */
export function UnshelvedSection({ books, onSpineClick }: Props) {
  if (books.length === 0) return null;
  return (
    <div
      className="relative px-12 py-6 mt-6"
      style={{
        background:
          "linear-gradient(180deg, rgba(58, 40, 24, 0.4) 0%, rgba(26, 14, 8, 0.6) 100%)",
        borderTop: "1px solid rgba(212, 176, 86, 0.18)",
      }}
    >
      <div className="mb-4">
        <h2 className="font-display text-lg text-paper-aged">Sem estante</h2>
        <p className="text-xs italic text-paper-aged/60 mt-0.5">
          {books.length} {books.length === 1 ? "livro" : "livros"} aguardando ·
          arraste pra uma estante ou use &ldquo;Reorganizar biblioteca&rdquo; no
          topo
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-1">
        {books.map((book) => (
          <BookSpine
            key={book.id}
            book={book}
            mode="wall"
            draggable
            onSpineClick={onSpineClick}
          />
        ))}
      </div>
    </div>
  );
}
