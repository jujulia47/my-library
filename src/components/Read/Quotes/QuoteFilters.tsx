"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import clsx from "clsx";
import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftIcon,
  BookOpenIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";
import { Button, Select, Card, Badge, Input } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui/Badge";

const TYPE_OPTIONS: { value: string; label: string; variant: BadgeVariant }[] = [
  { value: "linked", label: "Vinculada a livro", variant: "moss" },
  { value: "standalone", label: "Avulsa", variant: "terracota" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mais recentes primeiro" },
  { value: "oldest", label: "Mais antigas primeiro" },
  { value: "author_asc", label: "Autor (A-Z)" },
];

function parseList(v: string | null): string[] {
  if (!v) return [];
  return v.split(",").map((x) => x.trim()).filter(Boolean);
}

export type QuoteFiltersProps = {
  booksWithQuotes: { id: string; title: string }[];
  authorsAvailable: string[];
};

export default function QuoteFilters({
  booksWithQuotes,
  authorsAvailable,
}: QuoteFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const types = parseList(sp.get("type"));
  const bookIds = parseList(sp.get("book"));
  const authors = parseList(sp.get("author"));
  const search = sp.get("q") ?? "";
  const sort = sp.get("sort") ?? "newest";

  const [panelOpen, setPanelOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState(search);

  useEffect(() => {
    setSearchDraft(search);
  }, [search]);

  useEffect(() => {
    if (panelOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [panelOpen]);

  useEffect(() => {
    if (searchDraft === search) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (searchDraft) params.set("q", searchDraft);
      else params.delete("q");
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  const setParam = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(sp.toString());
    // Qualquer mudança de filtro/sort reseta paginação — página N do recorte
    // antigo não corresponde a N do novo.
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
    setParam({ type: null, book: null, author: null, q: null });
  };

  const activeCount =
    types.length + bookIds.length + authors.length + (search ? 1 : 0);

  const activeChips: {
    key: string;
    label: string;
    variant: BadgeVariant;
    onRemove: () => void;
  }[] = [];

  for (const t of types) {
    const opt = TYPE_OPTIONS.find((o) => o.value === t);
    if (opt)
      activeChips.push({
        key: `type:${t}`,
        label: opt.label,
        variant: opt.variant,
        onRemove: () => removeListItem("type", types, t),
      });
  }
  for (const id of bookIds) {
    const book = booksWithQuotes.find((b) => b.id === id);
    if (book)
      activeChips.push({
        key: `book:${id}`,
        label: book.title,
        variant: "navy",
        onRemove: () => removeListItem("book", bookIds, id),
      });
  }
  for (const a of authors) {
    activeChips.push({
      key: `author:${a}`,
      label: a === "__none__" ? "Sem atribuição" : a,
      variant: "olive",
      onRemove: () => removeListItem("author", authors, a),
    });
  }
  if (search) {
    activeChips.push({
      key: "search",
      label: `"${search}"`,
      variant: "fade",
      onRemove: () => setParam({ q: null }),
    });
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
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
            placeholder="Ordenar"
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
              label="Buscar no texto"
              icon={MagnifyingGlassIcon}
              iconColor="text-ink-fade"
            >
              <Input
                aria-label="Buscar no texto"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Trecho..."
              />
            </FilterGroup>

            <FilterGroup
              label="Tipo"
              icon={ChatBubbleLeftIcon}
              iconColor="text-gold"
            >
              <CheckboxList
                options={TYPE_OPTIONS}
                selected={types}
                onToggle={(v) => toggleListItem("type", types, v)}
              />
            </FilterGroup>

            {booksWithQuotes.length > 0 && (
              <FilterGroup
                label="Livro"
                icon={BookOpenIcon}
                iconColor="text-navy"
              >
                <Select
                  aria-label="Livro"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      toggleListItem("book", bookIds, e.target.value);
                    }
                  }}
                  options={booksWithQuotes
                    .filter((b) => !bookIds.includes(b.id))
                    .map((b) => ({ value: b.id, label: b.title }))}
                  placeholder="Adicionar livro…"
                />
              </FilterGroup>
            )}

            {authorsAvailable.length > 0 && (
              <FilterGroup
                label="Autor"
                icon={UserCircleIcon}
                iconColor="text-cappuccino"
              >
                <Select
                  aria-label="Autor"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      toggleListItem("author", authors, e.target.value);
                    }
                  }}
                  options={[
                    { value: "__none__", label: "Sem atribuição" },
                    ...authorsAvailable
                      .filter((a) => !authors.includes(a))
                      .map((a) => ({ value: a, label: a })),
                  ]}
                  placeholder="Adicionar autor…"
                />
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

function CheckboxList({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const set = new Set(selected);
  return (
    <ul className="space-y-1.5">
      {options.map((o) => {
        const checked = set.has(o.value);
        return (
          <li key={o.value}>
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-ink-deep">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(o.value)}
                className="w-4 h-4 rounded border-border accent-[#6D3914] focus:ring-2 focus:ring-[#6D3914]/30 cursor-pointer"
              />
              <span>{o.label}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
