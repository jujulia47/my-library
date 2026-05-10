"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { hrefForResult } from "@/services/globalSearchShared";
import type {
  GlobalSearchResult,
  SearchResultGroup,
  SearchResultItem,
} from "@/services/globalSearchShared";
import { BookCoverFallback } from "@/components/ui";

const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;

type FlatResult = {
  group_idx: number;
  item_idx: number;
  group: SearchResultGroup;
  item: SearchResultItem;
  href: string;
};

/**
 * Acha plataforma — Cmd no Mac, Ctrl em Windows/Linux. Pra label do hint.
 * No handler de keydown, aceitamos qualquer um dos dois (metaKey || ctrlKey).
 */
function useIsMac() {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent || navigator.platform || "";
    setIsMac(/mac/i.test(ua));
  }, []);
  return isMac;
}

export default function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);
  const isMac = useIsMac();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GlobalSearchResult | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Achatar grupos em uma lista linear pra facilitar nav por setas.
  const flat = useMemo<FlatResult[]>(() => {
    if (!result) return [];
    const arr: FlatResult[] = [];
    result.groups.forEach((g, gi) => {
      g.items.forEach((it, ii) => {
        arr.push({
          group_idx: gi,
          item_idx: ii,
          group: g,
          item: it,
          href: hrefForResult(g.category, it.slug, it.id),
        });
      });
    });
    return arr;
  }, [result]);

  // Cmd/Ctrl+K: foca o input. Esc: fecha dropdown e blur do input.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Click fora fecha o dropdown.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Reseta cursor pro topo quando muda o conjunto de resultados.
  useEffect(() => {
    setActiveIdx(0);
  }, [result]);

  // Busca debounced + AbortController.
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (query.trim().length < MIN_QUERY) {
      setResult(null);
      setError(null);
      setLoading(false);
      // cancela request em vôo
      abortRef.current?.abort();
      abortRef.current = null;
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) {
          setError("Erro ao buscar. Tente novamente.");
          setResult(null);
          return;
        }
        const json = (await res.json()) as GlobalSearchResult & {
          q: string;
          took_ms: number;
        };
        setError(null);
        setResult(json);
      } catch (err: unknown) {
        if ((err as { name?: string }).name === "AbortError") return;
        setError("Erro ao buscar. Tente novamente.");
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const navigateAndClose = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      setResult(null);
      router.push(href);
    },
    [router],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open) return;
    if (flat.length === 0) {
      if (e.key === "Enter" && query.trim().length >= MIN_QUERY) {
        e.preventDefault();
        navigateAndClose(`/search?q=${encodeURIComponent(query.trim())}`);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = flat[activeIdx];
      if (target) navigateAndClose(target.href);
    }
  };

  const showDropdown = open && query.trim().length >= MIN_QUERY;
  const hasResults = result && result.groups.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-[360px]">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-fade">
          <MagnifyingGlassIcon className="w-4 h-4" />
        </span>
        <input
          ref={inputRef}
          type="text"
          aria-label="Buscar global"
          aria-expanded={showDropdown}
          aria-controls="global-search-dropdown"
          aria-autocomplete="list"
          placeholder="Buscar livros, séries, autores, citações..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={clsx(
            "w-full rounded-md bg-ivory-light text-ink-deep placeholder:text-ink-fade",
            "border border-ink-fade/40 focus:border-gold focus:ring-2 focus:ring-gold/20",
            "pl-10 pr-20 py-2 text-sm font-body outline-none transition-colors",
          )}
        />
        <span className="absolute inset-y-0 right-2 flex items-center gap-1.5">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResult(null);
                inputRef.current?.focus();
              }}
              aria-label="Limpar busca"
              className="p-1 rounded text-ink-fade hover:text-ink-deep hover:bg-paper-soft transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          <kbd
            className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-body font-medium text-ink-fade border border-ink-fade/30 bg-paper-soft/50"
            aria-hidden
          >
            {isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        </span>
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          id="global-search-dropdown"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 rounded-md border border-border bg-ivory-light shadow-lg z-50 max-h-[480px] overflow-y-auto custom-scrollbar"
        >
          {loading && !result && (
            <p className="px-4 py-3 text-sm italic text-ink-fade">
              Buscando…
            </p>
          )}
          {error && (
            <p className="px-4 py-3 text-sm text-burgundy bg-burgundy/10">
              {error}
            </p>
          )}
          {!loading && !error && result && !hasResults && (
            <p className="px-4 py-6 text-sm italic text-ink-fade text-center">
              Nenhum resultado para «{query.trim()}»
            </p>
          )}
          {hasResults && (
            <>
              {result.groups.map((g, gi) => (
                <SearchGroup
                  key={g.category}
                  group={g}
                  groupIdx={gi}
                  flat={flat}
                  activeIdx={activeIdx}
                  onHover={setActiveIdx}
                  onSelect={navigateAndClose}
                />
              ))}
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                  setResult(null);
                }}
                className="block px-4 py-2.5 text-center text-sm text-ink-soft hover:text-ink-deep hover:bg-paper-soft border-t border-border transition-colors"
              >
                Ver todos os {result.total} resultados →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SearchGroup({
  group,
  groupIdx,
  flat,
  activeIdx,
  onHover,
  onSelect,
}: {
  group: SearchResultGroup;
  groupIdx: number;
  flat: FlatResult[];
  activeIdx: number;
  onHover: (idx: number) => void;
  onSelect: (href: string) => void;
}) {
  return (
    <section className="border-b border-border last:border-b-0">
      <header className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wider text-ink-fade font-medium">
        {group.label} ({group.total})
      </header>
      <ul>
        {group.items.map((item, ii) => {
          const flatIdx = flat.findIndex(
            (f) => f.group_idx === groupIdx && f.item_idx === ii,
          );
          const active = flatIdx === activeIdx;
          const href = flat[flatIdx]?.href ?? "/";
          return (
            <li key={`${group.category}-${item.id}`}>
              <button
                type="button"
                onMouseEnter={() => onHover(flatIdx)}
                onClick={() => onSelect(href)}
                className={clsx(
                  "w-full flex items-start gap-3 px-4 py-2 text-left transition-colors",
                  active
                    ? "bg-gold/15"
                    : "hover:bg-paper-soft/60",
                )}
                role="option"
                aria-selected={active}
              >
                <ResultThumb item={item} category={group.category} />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-ink-deep leading-tight line-clamp-1">
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="text-xs italic text-ink-fade truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ResultThumb({
  item,
  category,
}: {
  item: SearchResultItem;
  category: SearchResultGroup["category"];
}) {
  // Capa real só pra book; outros usam fallback estilizado pequeno.
  if (category === "book" && item.cover_url) {
    return (
      <div
        className="w-7 flex-shrink-0 relative rounded-sm overflow-hidden border border-ink-deep/15"
        style={{ aspectRatio: "2 / 3" }}
      >
        <Image
          src={item.cover_url}
          alt=""
          fill
          className="object-cover"
          sizes="28px"
        />
      </div>
    );
  }
  if (category === "book" || category === "wishlist") {
    return (
      <div
        className={clsx(
          "w-7 flex-shrink-0 relative rounded-sm overflow-hidden border",
          category === "wishlist"
            ? "border-terracota/35 bg-terracota/[0.10]"
            : "border-ink-deep/15",
        )}
        style={{ aspectRatio: "2 / 3" }}
      >
        <BookCoverFallback
          title={item.title}
          size="sm"
          className="w-full h-full"
        />
      </div>
    );
  }
  // Não-book/wishlist: indicador simples colorido por categoria.
  const colorByCategory: Record<string, string> = {
    serie: "bg-moss/20 text-moss",
    author: "bg-cappuccino/20 text-cappuccino",
    quote: "bg-gold/20 text-gold-deep",
    collection: "bg-navy/20 text-navy",
  };
  const cls = colorByCategory[category] ?? "bg-ink-fade/20 text-ink-soft";
  const initial = item.title.replace(/^[“"']/, "")[0]?.toUpperCase() ?? "?";
  return (
    <div
      className={clsx(
        "w-7 h-7 flex-shrink-0 rounded-sm flex items-center justify-center font-display text-xs font-medium",
        cls,
      )}
    >
      {initial}
    </div>
  );
}
