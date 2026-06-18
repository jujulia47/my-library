"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookCoverFallback } from "@/components/ui";
import { assignBookToShelf } from "@/actions/assignBookToShelf";

export type OrphanBook = {
  id: string;
  slug: string;
  title: string;
  author_name: string | null;
  cover_url: string | null;
};

type Props = {
  orphans: OrphanBook[];
  shelfId: string;
};

/**
 * Lista clicável de livros físicos sem estante, com search inline. Click em
 * um livro chama `assignBookToShelf` e volta pra `/library/shelf/[id]`.
 */
export function BookPickerForShelf({ orphans, shelfId }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingBookId, setPendingBookId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orphans;
    return orphans.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.author_name?.toLowerCase().includes(q) ?? false),
    );
  }, [orphans, search]);

  const handlePick = (bookId: string) => {
    setError(null);
    setPendingBookId(bookId);
    startTransition(async () => {
      const result = await assignBookToShelf({ bookId, shelfId });
      setPendingBookId(null);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(`/library/shelf/${shelfId}`);
      router.refresh();
    });
  };

  if (orphans.length === 0) {
    return (
      <div
        className="text-center py-16 italic"
        style={{ color: "rgba(245, 232, 208, 0.65)" }}
      >
        <p className="text-base mb-3">
          Todos os seus livros físicos já estão em estantes.
        </p>
        <Link
          href="/book/new"
          className="text-sm underline hover:text-gold transition-colors"
          style={{ color: "rgba(240,192,64,0.85)" }}
        >
          Catalogar novo livro
        </Link>
      </div>
    );
  }

  return (
    <div>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por título ou autor"
        className="w-full mb-4 px-3 py-2 rounded-md text-sm bg-black/30 border border-gold/30 placeholder:italic focus:border-gold focus:outline-none"
        style={{ color: "var(--color-paper-aged)" }}
      />

      {error && (
        <p className="mb-3 text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <p
          className="text-center italic py-8 text-sm"
          style={{ color: "rgba(245, 232, 208, 0.55)" }}
        >
          Nenhum livro corresponde à busca.
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((book) => {
            const isPending = pendingBookId === book.id;
            return (
              <li key={book.id}>
                <button
                  type="button"
                  onClick={() => handlePick(book.id)}
                  disabled={pendingBookId !== null}
                  className="w-full flex gap-3 p-3 rounded-md border text-left transition-all hover:border-gold disabled:opacity-50"
                  style={{
                    background: "rgba(0,0,0,0.25)",
                    borderColor: "rgba(240,192,64,0.25)",
                    color: "var(--color-paper-aged)",
                  }}
                >
                  <div
                    className="relative flex-shrink-0 w-[44px] h-[66px] rounded-sm overflow-hidden border border-black/40"
                    style={{ aspectRatio: "2 / 3" }}
                  >
                    <BookCoverFallback
                      title={book.title}
                      size="sm"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm leading-tight line-clamp-2">
                      {book.title}
                    </p>
                    {book.author_name && (
                      <p
                        className="text-[11px] italic mt-1 truncate"
                        style={{ color: "rgba(245, 232, 208, 0.55)" }}
                      >
                        {book.author_name}
                      </p>
                    )}
                    {isPending && (
                      <p
                        className="text-[10px] italic mt-1"
                        style={{ color: "rgba(240,192,64,0.7)" }}
                      >
                        adicionando...
                      </p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
