"use client";

import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import type { AuthorOption } from "./AuthorMultiSelect";

type Props = {
  label?: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
};

/**
 * Input de "autor por nome" com autocomplete dos autores já cadastrados.
 *
 * Diferente do AuthorMultiSelect, este componente NÃO gera author_ids — só
 * sugere completar o texto. O valor submetido continua sendo o nome cru
 * (text), pra encaixar em entidades como `wishlist.author_name` que guardam
 * só string e não FK.
 *
 * Comportamento:
 *  - Digita 2+ chars → busca em /api/authors/search (mesma rota do
 *    MultiSelect) com debounce de 200ms.
 *  - Dropdown mostra os matches; click ou Enter no item preenche o input
 *    com o nome do autor selecionado.
 *  - Esc fecha o dropdown.
 *  - Click fora também fecha.
 */
export default function AuthorNameInput({
  label,
  name,
  defaultValue,
  placeholder = "Ex.: Philip K. Dick",
  helperText,
  errorText,
}: Props) {
  const reactId = useId();
  const inputId = `${reactId}-author-name`;
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<AuthorOption[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click fora fecha.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounce + fetch.
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!open) return;
    const query = value.trim();
    if (query.length < 2) {
      setMatches([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/authors/search?q=${encodeURIComponent(query)}`,
        );
        if (!res.ok) return;
        const json = (await res.json()) as { authors?: AuthorOption[] };
        setMatches(json.authors ?? []);
        setActiveIdx(0);
      } catch {
        // best-effort
      }
    }, 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value, open]);

  const pick = (author: AuthorOption) => {
    setValue(author.name);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(matches.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = matches[activeIdx];
      if (target) pick(target);
    }
  };

  const showDropdown = open && matches.length > 0;

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-body font-medium text-ink-deep"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={clsx(
            "w-full rounded-md bg-ivory-light text-ink-deep placeholder:text-ink-fade",
            "border border-border focus:border-gold focus:ring-2 focus:ring-gold/20",
            "px-3 py-2 text-sm font-body outline-none transition-colors",
            errorText && "border-burgundy focus:border-burgundy",
          )}
        />
        {showDropdown && (
          <ul
            role="listbox"
            className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-ivory-light shadow-lg z-30"
          >
            {matches.map((m, idx) => (
              <li
                key={m.id}
                role="option"
                aria-selected={idx === activeIdx}
              >
                <button
                  type="button"
                  onClick={() => pick(m)}
                  onMouseEnter={() => setActiveIdx(idx)}
                  className={clsx(
                    "w-full text-left px-3 py-1.5 text-sm font-body transition-colors",
                    idx === activeIdx
                      ? "bg-gold/15 text-ink-deep"
                      : "text-ink-soft hover:bg-paper-soft",
                  )}
                >
                  {m.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {errorText ? (
        <p className="text-xs font-body text-burgundy">{errorText}</p>
      ) : helperText ? (
        <p className="text-xs font-body text-ink-fade">{helperText}</p>
      ) : null}
    </div>
  );
}
