"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import {
  XMarkIcon,
  PlusIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { createSerieMinimal } from "@/actions/createSerieMinimal";
import { normalizeName } from "@/utils/normalizeName";

export type SerieOption = { id: string; name: string };

export type SerieSelectProps = {
  value: SerieOption | null;
  onChange: (serie: SerieOption | null) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  /**
   * Se passado, renderiza um <input type="hidden"> com este nome contendo o id
   * da série selecionada (ou string vazia).
   */
  hiddenFieldName?: string;
};

export default function SerieSelect({
  value,
  onChange,
  placeholder = "Buscar ou criar série",
  label,
  helperText,
  errorText,
  hiddenFieldName,
}: SerieSelectProps) {
  const reactId = useId();
  const inputId = `${reactId}-serie`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<SerieOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [similarMatch, setSimilarMatch] = useState<SerieOption | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);
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
    if (!open || value) return;

    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const url = `/api/series/search?q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (!res.ok) {
          setMatches([]);
          return;
        }
        const json = (await res.json()) as { series: SerieOption[] };
        setMatches(json.series);
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
  const showCreateOption = trimmed.length > 0 && !hasExactMatch && !value;

  const select = (s: SerieOption) => {
    onChange(s);
    setQuery("");
    setMatches([]);
    setSimilarMatch(null);
    setPendingName(null);
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setSimilarMatch(null);
    setPendingName(null);
    inputRef.current?.focus();
  };

  const reallyCreate = (name: string) => {
    startTransition(async () => {
      const result = await createSerieMinimal(name);
      if (result.ok) {
        select({ id: result.id, name: result.name });
      }
    });
  };

  const handleCreateClick = () => {
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
        select(matches[0]);
      } else if (showCreateOption) {
        handleCreateClick();
      }
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
          "min-h-[44px] w-full rounded-md border bg-ivory-light px-3 py-2 transition-colors duration-150 flex items-center gap-2",
          errorText
            ? "border-burgundy"
            : "border-border focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20",
        )}
      >
        {value ? (
          <>
            <span className="text-ink-deep flex-1">{value.name}</span>
            <button
              type="button"
              onClick={clear}
              aria-label={`Remover série ${value.name}`}
              className="text-ink-soft hover:text-burgundy transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </>
        ) : (
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-0 outline-none text-ink-deep placeholder:text-ink-fade"
          />
        )}
      </div>

      {open && !value && (matches.length > 0 || showCreateOption || loading) && (
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
              onClick={() => select(m)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-paper text-ink-deep transition-colors"
            >
              {m.name}
            </button>
          ))}
          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreateClick}
              disabled={isPending}
              className="w-full text-left px-3 py-2 text-sm hover:bg-paper text-ink-deep flex items-center gap-2 border-t border-border transition-colors disabled:opacity-50"
            >
              <PlusIcon className="w-4 h-4 text-gold-deep" />
              <span>
                Criar série:{" "}
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
                  onClick={() => select(similarMatch)}
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

      {hiddenFieldName && (
        <input
          type="hidden"
          name={hiddenFieldName}
          value={value?.id ?? ""}
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
