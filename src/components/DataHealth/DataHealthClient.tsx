"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { imagesUrl } from "@/services/images";
import type { DataHealthData, HealthField } from "@/services/dataHealthData";

const PAGE_SIZE = 20;

export function DataHealthClient({ data }: { data: DataHealthData }) {
  const [filter, setFilter] = useState<HealthField | null>(null);
  const [page, setPage] = useState(1);

  const pct =
    data.totalBooks > 0
      ? Math.round((data.completeBooks / data.totalBooks) * 100)
      : 100;

  const books = useMemo(
    () =>
      filter ? data.books.filter((b) => b.missing.includes(filter)) : data.books,
    [data.books, filter],
  );

  // Volta pra 1ª página ao trocar o filtro.
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(books.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageBooks = books.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="font-body">
      <header className="pb-4 border-b border-border">
        <p className="font-body text-xs uppercase tracking-[0.25em] text-ink-fade">
          Saúde do acervo
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-ink-deep mt-1 leading-tight">
          Campos faltando
        </h1>
        <p className="text-ink-soft mt-2 max-w-2xl">
          Livros com algum campo bibliográfico vazio. Clique num campo pra
          filtrar, e em “Editar” pra completar.
        </p>
      </header>

      {/* resumo */}
      <div className="bg-paper border border-paper-soft rounded-lg p-4 md:p-5 mt-6">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-sm text-ink-soft">
            <span className="font-medium text-ink-deep">
              {data.completeBooks}
            </span>{" "}
            de {data.totalBooks} livros completos
          </span>
          <span className="text-sm font-medium text-[#6D3914] tabular-nums">
            {pct}%
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-paper-soft overflow-hidden">
          <div
            className="h-full rounded-full bg-cappuccino"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {data.books.length === 0 ? (
        <p className="text-center italic text-ink-soft py-16">
          Tudo preenchido — seu acervo está completo. 🎉
        </p>
      ) : (
        <>
          {/* filtro por campo */}
          <div className="flex flex-wrap gap-2 mt-6">
            <button
              onClick={() => setFilter(null)}
              className={clsx(
                "font-mono text-xs tracking-wide rounded-full px-3 py-1.5 border transition-colors",
                filter === null
                  ? "bg-ink-deep text-ivory border-ink-deep"
                  : "bg-paper text-ink-soft border-border hover:border-gold",
              )}
            >
              Todos · {data.books.length}
            </button>
            {data.fieldCounts.map((f) => (
              <button
                key={f.field}
                onClick={() => setFilter(f.field)}
                className={clsx(
                  "font-mono text-xs tracking-wide rounded-full px-3 py-1.5 border transition-colors",
                  filter === f.field
                    ? "bg-burgundy text-ivory border-burgundy"
                    : "bg-paper text-ink-soft border-border hover:border-gold",
                )}
              >
                {f.field} · {f.count}
              </button>
            ))}
          </div>

          {/* lista */}
          <ul className="mt-4 divide-y divide-border/50 border border-paper-soft rounded-lg overflow-hidden">
            {pageBooks.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-3 p-3 bg-paper hover:bg-paper-soft/40 transition-colors"
              >
                <div className="w-10 h-[60px] flex-shrink-0 rounded overflow-hidden bg-paper-soft border border-border">
                  {b.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagesUrl(b.cover)}
                      alt={b.title}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-display text-ink-deep leading-snug truncate">
                    {b.title}
                  </p>
                  {b.author && (
                    <p className="text-xs italic text-ink-fade truncate">
                      {b.author}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {b.missing.map((m) => (
                      <span
                        key={m}
                        className={clsx(
                          "font-mono text-[10px] tracking-wide rounded px-1.5 py-0.5",
                          filter === m
                            ? "bg-burgundy/15 text-burgundy"
                            : "bg-paper-soft text-ink-soft",
                        )}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/book/edit/${b.id}?from=/saude-dados`}
                  className="flex-shrink-0 font-mono text-xs uppercase tracking-wide text-gold-deep border border-border rounded-md px-3 py-2 hover:border-gold hover:text-ink-deep transition-colors"
                >
                  Editar
                </Link>
              </li>
            ))}
          </ul>

          {books.length === 0 && (
            <p className="text-center italic text-ink-soft py-10">
              Nenhum livro faltando “{filter}”.
            </p>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={current <= 1}
                className="font-mono text-xs uppercase tracking-wide text-ink-soft border border-border rounded-md px-3 py-2 hover:border-gold hover:text-ink-deep transition-colors disabled:opacity-40 disabled:cursor-default disabled:hover:border-border"
              >
                ◀ Anterior
              </button>
              <span className="font-mono text-xs text-ink-soft tabular-nums">
                página {current} de {totalPages} · {books.length} livros
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={current >= totalPages}
                className="font-mono text-xs uppercase tracking-wide text-ink-soft border border-border rounded-md px-3 py-2 hover:border-gold hover:text-ink-deep transition-colors disabled:opacity-40 disabled:cursor-default disabled:hover:border-border"
              >
                Próxima ▶
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
