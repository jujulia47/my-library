"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import {
  XMarkIcon,
  PlusIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { createAuthor } from "@/actions/createAuthor";
import { normalizeName } from "@/utils/normalizeName";

export type AuthorOption = { id: string; name: string };

export type AuthorMultiSelectProps = {
  value: AuthorOption[];
  onChange: (authors: AuthorOption[]) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  /**
   * Nome usado pelo Form quando este componente está dentro de um <form>.
   * Renderiza um array oculto de IDs com este nome.
   */
  hiddenFieldName?: string;
};

export default function AuthorMultiSelect({
  value,
  onChange,
  placeholder = "Adicionar autor",
  label,
  helperText,
  errorText,
  hiddenFieldName,
}: AuthorMultiSelectProps) {
  const reactId = useId();
  const inputId = `${reactId}-author`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<AuthorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [similarMatch, setSimilarMatch] = useState<AuthorOption | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  // Fecha dropdown ao clicar fora.
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

  // Debounce de busca.
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!open) return;

    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const url = `/api/authors/search?q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (!res.ok) {
          setMatches([]);
          return;
        }
        const json = (await res.json()) as { authors: AuthorOption[] };
        const selectedIds = new Set(value.map((a) => a.id));
        setMatches(json.authors.filter((a) => !selectedIds.has(a.id)));
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, open, value]);

  const trimmed = query.trim();
  const hasExactMatch = matches.some(
    (m) => m.name.toLowerCase() === trimmed.toLowerCase(),
  );
  const showCreateOption = trimmed.length > 0 && !hasExactMatch;

  const addAuthor = (author: AuthorOption) => {
    if (value.some((a) => a.id === author.id)) return;
    onChange([...value, author]);
    setQuery("");
    setMatches([]);
    setSimilarMatch(null);
    setPendingName(null);
    inputRef.current?.focus();
  };

  const removeAuthor = (id: string) => {
    onChange(value.filter((a) => a.id !== id));
  };

  const reallyCreate = (name: string) => {
    startTransition(async () => {
      const result = await createAuthor(name);
      if (result.ok) {
        addAuthor({ id: result.id, name: result.name });
      }
    });
  };

  const handleCreate = () => {
    if (!trimmed) return;
    const norm = normalizeName(trimmed);
    const similar = matches.find((m) => normalizeName(m.name) === norm);
    if (similar) {
      setSimilarMatch(similar);
      setPendingName(trimmed);
      return;
    }
    reallyCreate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (matches[0]) {
        addAuthor(matches[0]);
      } else if (showCreateOption) {
        handleCreate();
      }
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      removeAuthor(value[value.length - 1].id);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
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
          "min-h-[44px] w-full rounded-md border bg-ivory-light px-2 py-1.5 transition-colors duration-150",
          errorText
            ? "border-burgundy"
            : "border-border focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20",
        )}
      >
        <div className="flex flex-wrap gap-1.5 items-center">
          {value.map((author) => (
            <span
              key={author.id}
              className="inline-flex items-center gap-1 rounded-full border border-gold/35 bg-gold/[0.18] px-2.5 py-0.5 text-sm text-gold-deep"
            >
              {author.name}
              <button
                type="button"
                onClick={() => removeAuthor(author.id)}
                aria-label={`Remover ${author.name}`}
                className="text-gold-deep/70 hover:text-burgundy transition-colors"
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
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-ink-deep placeholder:text-ink-fade px-1.5 py-1"
          />
        </div>
      </div>

      {open && (matches.length > 0 || showCreateOption || loading) && (
        <div className="absolute z-30 left-0 right-0 mt-1 rounded-md border border-border bg-ivory-light shadow-lg max-h-60 overflow-auto custom-scrollbar">
          {loading && matches.length === 0 && !showCreateOption ? (
            <div className="px-3 py-2 text-sm text-ink-fade italic">
              Buscando…
            </div>
          ) : null}
          {matches.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => addAuthor(m)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-paper text-ink-deep transition-colors"
            >
              {m.name}
            </button>
          ))}
          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={isPending}
              className="w-full text-left px-3 py-2 text-sm hover:bg-paper text-ink-deep flex items-center gap-2 border-t border-border transition-colors disabled:opacity-50"
            >
              <PlusIcon className="w-4 h-4 text-gold-deep" />
              <span>
                Criar autor:{" "}
                <span className="italic font-medium">{trimmed}</span>
              </span>
            </button>
          )}
        </div>
      )}

      {similarMatch && pendingName && (
        <div className="rounded-md border border-gold/40 bg-gold/10 p-3 text-sm">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-gold-deep flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-ink-deep">
                Já existe{" "}
                <span className="italic font-medium">
                  &ldquo;{similarMatch.name}&rdquo;
                </span>{" "}
                na sua lista. Quer usar essa?
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addAuthor(similarMatch)}
                  className="px-3 py-1 rounded-md bg-ink-deep text-ivory text-xs hover:bg-ink-soft transition-colors"
                >
                  Usar existente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimilarMatch(null);
                    reallyCreate(pendingName);
                  }}
                  className="px-3 py-1 rounded-md border border-border bg-ivory-light text-ink-soft text-xs hover:bg-paper transition-colors"
                >
                  Criar mesmo assim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {hiddenFieldName &&
        value.map((a) => (
          <input
            key={a.id}
            type="hidden"
            name={hiddenFieldName}
            value={a.id}
          />
        ))}

      {errorText ? (
        <p className="text-xs font-body text-burgundy">{errorText}</p>
      ) : helperText ? (
        <p className="text-xs font-body text-ink-fade">{helperText}</p>
      ) : null}
    </div>
  );
}
