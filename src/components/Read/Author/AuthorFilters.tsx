"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import clsx from "clsx";
import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  GlobeAmericasIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";
import { Button, Select, Card, Badge, Input } from "@/components/ui";
import {
  COUNTRY_LABELS,
  COUNTRY_CODES,
} from "@/utils/countryLabels";
import type { Database } from "@/utils/typings/supabase";
import type { BadgeVariant } from "@/components/ui/Badge";

type Country = Database["public"]["Enums"]["country"];

const SORT_OPTIONS = [
  { value: "name_asc", label: "Nome (A-Z)" },
  { value: "books_desc", label: "Mais livros" },
  { value: "finished_desc", label: "Mais lidos" },
  { value: "newest", label: "Recém-adicionados" },
];

function parseList(v: string | null): string[] {
  if (!v) return [];
  return v.split(",").map((x) => x.trim()).filter(Boolean);
}

export type AuthorFiltersProps = {
  countriesAvailable: Country[];
};

export default function AuthorFilters({
  countriesAvailable,
}: AuthorFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const initialQ = sp.get("q") ?? "";
  const countries = parseList(sp.get("country"));
  const hasBooks = sp.get("has_books") === "true";
  const sort = sp.get("sort") ?? "name_asc";

  const [searchDraft, setSearchDraft] = useState(initialQ);
  const [panelOpen, setPanelOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);

  // Debounce search 300ms
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const current = sp.get("q") ?? "";
      if (searchDraft === current) return;
      const params = new URLSearchParams(sp.toString());
      params.delete("page");
      if (searchDraft.trim()) params.set("q", searchDraft.trim());
      else params.delete("q");
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  useEffect(() => {
    if (panelOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [panelOpen]);

  const setParam = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(sp.toString());
    params.delete("page");
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleListItem = (key: string, current: string[], val: string) => {
    const set = new Set(current);
    if (set.has(val)) set.delete(val);
    else set.add(val);
    const next = [...set].join(",");
    setParam({ [key]: next || null });
  };
  const removeListItem = (key: string, current: string[], val: string) => {
    const next = current.filter((x) => x !== val).join(",");
    setParam({ [key]: next || null });
  };
  const clearAll = () => {
    setParam({ country: null, has_books: null, q: null });
    setSearchDraft("");
  };

  const activeCount =
    countries.length + (hasBooks ? 1 : 0) + (initialQ ? 1 : 0);

  const activeChips: {
    key: string;
    label: string;
    variant: BadgeVariant;
    onRemove: () => void;
  }[] = [];
  if (initialQ) {
    activeChips.push({
      key: `q:${initialQ}`,
      label: `"${initialQ}"`,
      variant: "olive",
      onRemove: () => {
        setSearchDraft("");
        setParam({ q: null });
      },
    });
  }
  for (const c of countries) {
    if (COUNTRY_LABELS[c as Country]) {
      activeChips.push({
        key: `country:${c}`,
        label: `${COUNTRY_CODES[c as Country]} · ${COUNTRY_LABELS[c as Country]}`,
        variant: "gold",
        onRemove: () => removeListItem("country", countries, c),
      });
    }
  }
  if (hasBooks) {
    activeChips.push({
      key: "has_books",
      label: "Com livros",
      variant: "moss",
      onRemove: () => setParam({ has_books: null }),
    });
  }

  const countryOptions = countriesAvailable
    .map((c) => ({
      value: c,
      label: `${COUNTRY_CODES[c]} · ${COUNTRY_LABELS[c]}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-56">
          <Input
            type="text"
            placeholder="Buscar autor..."
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            leftIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
          onClick={() => setPanelOpen(true)}
        >
          {activeCount > 0 ? `Filtros · ${activeCount}` : "Filtros"}
        </Button>
        <div className="w-44">
          <Select
            aria-label="Ordenar"
            value={sort}
            onChange={(e) => setParam({ sort: e.target.value })}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      {activeChips.length > 0 && (
        <Card size="sm" className="mb-6 mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm italic text-ink-fade mr-1">
              Filtros ativos:
            </span>
            {activeChips.map((chip) => (
              <span key={chip.key} className="inline-flex items-center gap-1">
                <Badge variant={chip.variant} size="sm">
                  <span className="flex items-center gap-1">
                    {chip.label}
                    <button
                      type="button"
                      onClick={chip.onRemove}
                      aria-label={`Remover filtro ${chip.label}`}
                      className="ml-1 hover:text-burgundy transition-colors"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </Badge>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="ml-auto text-sm text-ink-soft underline hover:text-ink-deep transition-colors"
            >
              Limpar tudo
            </button>
          </div>
        </Card>
      )}

      <div
        className={clsx(
          "fixed inset-0 z-50 transition-opacity duration-200",
          panelOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        aria-hidden={!panelOpen}
      >
        <div
          className="absolute inset-0 bg-ink-deep/40"
          onClick={() => setPanelOpen(false)}
        />
        <aside
          className={clsx(
            "absolute bg-paper border-border flex flex-col shadow-2xl",
            "md:right-0 md:top-0 md:h-screen md:w-80 md:border-l",
            "left-0 right-0 bottom-0 max-h-[85vh] rounded-t-xl border-t md:rounded-none",
            "transform transition-transform duration-200",
            panelOpen
              ? "translate-y-0 md:translate-x-0"
              : "translate-y-full md:translate-y-0 md:translate-x-full",
          )}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <h2 className="font-display text-xl font-medium text-ink-deep">
              Filtros
            </h2>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              aria-label="Fechar filtros"
              className="p-1 rounded-md text-ink-soft hover:text-ink-deep hover:bg-paper-soft transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-5 space-y-6">
            <FilterGroup
              label="Acervo"
              icon={BookOpenIcon}
              iconColor="text-moss"
            >
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-ink-deep">
                <input
                  type="checkbox"
                  checked={hasBooks}
                  onChange={(e) =>
                    setParam({
                      has_books: e.target.checked ? "true" : null,
                    })
                  }
                  className="w-4 h-4 rounded border-border text-ink-deep focus:ring-gold/30"
                />
                <span>Apenas autores com livros</span>
              </label>
            </FilterGroup>
            {countryOptions.length > 0 && (
              <FilterGroup
                label="País"
                icon={GlobeAmericasIcon}
                iconColor="text-navy"
              >
                <ul className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar">
                  {countryOptions.map((opt) => {
                    const checked = countries.includes(opt.value);
                    return (
                      <li key={opt.value}>
                        <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-ink-deep">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleListItem("country", countries, opt.value)
                            }
                            className="w-4 h-4 rounded border-border text-ink-deep focus:ring-gold/30"
                          />
                          <span>{opt.label}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </FilterGroup>
            )}
          </div>
          <div className="border-t border-border p-4 flex-shrink-0">
            <Button
              type="button"
              variant="ghost-destructive"
              fullWidth
              onClick={clearAll}
            >
              Limpar tudo
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}

function FilterGroup({
  label,
  children,
  icon: Icon,
  iconColor,
}: {
  label: string;
  children: React.ReactNode;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  iconColor?: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-fade mb-2">
        {Icon && (
          <Icon
            className={`w-3.5 h-3.5 ${iconColor ?? "text-ink-fade"}`}
            aria-hidden
          />
        )}
        {label}
      </p>
      {children}
    </div>
  );
}
