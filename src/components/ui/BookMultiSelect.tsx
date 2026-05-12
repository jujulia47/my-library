"use client";

import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import { XMarkIcon } from "@heroicons/react/24/outline";

export type BookOption = { id: string; title: string; slug?: string };

export type BookMultiSelectProps = {
  value: BookOption[];
  onChange: (books: BookOption[]) => void;
  /** ID a excluir da busca (ex.: o próprio livro sendo editado). */
  excludeId?: string;
  placeholder?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  /** Se passado, gera <input type="hidden"> com os IDs separados por vírgula. */
  hiddenFieldName?: string;
};

/**
 * Picker de múltiplos livros com busca via `/api/books/search`. Mostra os
 * selecionados como chips; clique no × pra remover. Sem opção de "criar
 * novo" — só seleciona livros já cadastrados (caso de uso: bundled_with).
 */
export default function BookMultiSelect({
  value,
  onChange,
  excludeId,
  placeholder = "Buscar livro",
  label,
  helperText,
  errorText,
  hiddenFieldName,
}: BookMultiSelectProps) {
  const reactId = useId();
  const inputId = `${reactId}-book-multi`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<BookOption[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!open) return;
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (excludeId) params.set("exclude_id", excludeId);
        const res = await fetch(`/api/books/search?${params}`);
        if (!res.ok) {
          setMatches([]);
          return;
        }
        const json = (await res.json()) as { books: BookOption[] };
        // Remove os já selecionados da lista.
        const selectedIds = new Set(value.map((b) => b.id));
        setMatches(json.books.filter((b) => !selectedIds.has(b.id)));
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, open, value, excludeId]);

  const add = (book: BookOption) => {
    onChange([...value, book]);
    setQuery("");
    setMatches([]);
    inputRef.current?.focus();
  };

  const remove = (id: string) => {
    onChange(value.filter((b) => b.id !== id));
  };

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-body font-medium text-ink-deep"
        >
          {label}
        </label>
      )}

      <div
        className={clsx(
          "min-h-[44px] w-full rounded-md border bg-ivory-light px-3 py-2 transition-colors duration-150 flex flex-wrap items-center gap-2",
          errorText
            ? "border-burgundy"
            : "border-border focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20",
        )}
      >
        {value.map((book) => (
          <span
            key={book.id}
            className="inline-flex items-center gap-1 rounded-full bg-paper border border-border px-2.5 py-0.5 text-sm text-ink-deep"
          >
            <span className="italic">{book.title}</span>
            <button
              type="button"
              onClick={() => remove(book.id)}
              aria-label={`Remover ${book.title}`}
              className="text-ink-soft hover:text-burgundy transition-colors"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-ink-deep placeholder:text-ink-fade"
        />
      </div>

      {open && (matches.length > 0 || loading) && (
        <div className="absolute z-30 left-0 right-0 mt-1 rounded-md border border-border bg-ivory-light shadow-lg max-h-60 overflow-auto custom-scrollbar">
          {loading && matches.length === 0 ? (
            <div className="px-3 py-2 text-sm text-ink-fade italic">
              Buscando…
            </div>
          ) : null}
          {matches.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => add(m)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-paper text-ink-deep transition-colors"
            >
              {m.title}
            </button>
          ))}
        </div>
      )}

      {hiddenFieldName && (
        <input
          type="hidden"
          name={hiddenFieldName}
          value={value.map((b) => b.id).join(",")}
        />
      )}

      {errorText ? (
        <p className="text-xs font-body text-burgundy">{errorText}</p>
      ) : helperText ? (
        <p className="text-xs font-body text-ink-fade">{helperText}</p>
      ) : null}
    </div>
  );
}
