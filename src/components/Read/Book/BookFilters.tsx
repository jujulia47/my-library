"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import clsx from "clsx";
import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  BookOpenIcon,
  ArchiveBoxIcon,
  CalendarDaysIcon,
  RectangleStackIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";
import { Button, Select, Card, Badge } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui/Badge";
import SearchableCheckboxList from "@/components/Read/_shared/SearchableCheckboxList";

const STATUS_OPTIONS: { value: string; label: string; variant: BadgeVariant }[] = [
  { value: "reading", label: "Lendo", variant: "gold" },
  { value: "paused", label: "Pausado", variant: "gold" },
  { value: "finished", label: "Lido", variant: "gold" },
  { value: "abandoned", label: "Abandonado", variant: "gold" },
  { value: "tbr", label: "Quero ler", variant: "gold" },
];

const OWNERSHIP_OPTIONS: { value: string; label: string; variant: BadgeVariant }[] = [
  { value: "owned", label: "Na estante", variant: "moss" },
  { value: "disposed", label: "Doado", variant: "fade" },
  { value: "lent", label: "Emprestado", variant: "olive" },
  { value: "never_owned", label: "Nunca tive", variant: "fade" },
];

const FORMAT_OPTIONS: { value: string; label: string; variant: BadgeVariant }[] = [
  // Sessão 17.3: formato semantizado por cor (físico=cappuccino, ebook=moss,
  // audio=terracota — alinhado ao donut da home).
  { value: "physical", label: "Físico", variant: "cappuccino" },
  { value: "ebook", label: "E-book", variant: "moss" },
  { value: "audiobook", label: "Audiobook", variant: "terracota" },
];

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const SORT_OPTIONS = [
  { value: "reading_first", label: "Lendo" },
  { value: "last_reading_desc", label: "Última leitura" },
  { value: "title_asc", label: "Título (A-Z)" },
  { value: "title_desc", label: "Título (Z-A)" },
  { value: "created_desc", label: "Mais recente cadastrado" },
  { value: "acquired_asc", label: "Mais antigo na estante" },
];

function parseList(v: string | null): string[] {
  if (!v) return [];
  return v.split(",").map((x) => x.trim()).filter(Boolean);
}

export type BookFiltersProps = {
  yearsAvailable: number[];
  /** Todos os autores do usuário pra alimentar o filtro "Por autor". */
  allAuthors: { id: string; slug: string; name: string }[];
};

export default function BookFilters({
  yearsAvailable,
  allAuthors,
}: BookFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const statuses = parseList(sp.get("status"));
  const ownerships = parseList(sp.get("ownership"));
  const formats = parseList(sp.get("format"));
  const authorSlugs = parseList(sp.get("author"));
  const year = sp.get("year") ? Number(sp.get("year")) : null;
  const month = sp.get("month") ? Number(sp.get("month")) : null;
  const sort = sp.get("sort") ?? "reading_first";

  const [panelOpen, setPanelOpen] = useState(false);

  // Body scroll lock quando painel aberto.
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
    setParam({
      status: null,
      ownership: null,
      format: null,
      year: null,
      month: null,
      author: null,
    });
  };

  const activeCount =
    statuses.length +
    ownerships.length +
    formats.length +
    authorSlugs.length +
    (year ? 1 : 0);

  const activeChips: {
    key: string;
    label: string;
    variant: BadgeVariant;
    onRemove: () => void;
  }[] = [];

  for (const s of statuses) {
    const opt = STATUS_OPTIONS.find((o) => o.value === s);
    if (opt)
      activeChips.push({
        key: `status:${s}`,
        label: opt.label,
        variant: opt.variant,
        onRemove: () => removeListItem("status", statuses, s),
      });
  }
  for (const o of ownerships) {
    const opt = OWNERSHIP_OPTIONS.find((x) => x.value === o);
    if (opt)
      activeChips.push({
        key: `ownership:${o}`,
        label: opt.label,
        variant: opt.variant,
        onRemove: () => removeListItem("ownership", ownerships, o),
      });
  }
  if (year) {
    activeChips.push({
      key: `year:${year}${month ? `:${month}` : ""}`,
      label:
        month && month >= 1 && month <= 12
          ? `Lidos em ${year} / ${MONTHS[month - 1]}`
          : `Lidos em ${year}`,
      variant: "navy",
      onRemove: () => setParam({ year: null, month: null }),
    });
  }
  for (const f of formats) {
    const opt = FORMAT_OPTIONS.find((x) => x.value === f);
    if (opt)
      activeChips.push({
        key: `format:${f}`,
        label: opt.label,
        variant: opt.variant,
        onRemove: () => removeListItem("format", formats, f),
      });
  }
  for (const slug of authorSlugs) {
    const found = allAuthors.find((a) => a.slug === slug);
    if (found)
      activeChips.push({
        key: `author:${slug}`,
        label: found.name,
        variant: "fade",
        onRemove: () => removeListItem("author", authorSlugs, slug),
      });
  }

  return (
    <>
      {/* Linha de controles à direita do header */}
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

      {/* Faixa de chips ativos */}
      {activeChips.length > 0 && (
        <Card size="sm" className="mb-6 mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm italic text-ink-fade mr-1">
              Filtros ativos:
            </span>
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1"
              >
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

      {/* Painel de filtros (drawer). z-index 50 cobre o sidebar (z-40). */}
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
            // Desktop: painel lateral DIREITO.
            "md:right-0 md:top-0 md:h-screen md:w-80 md:border-l",
            // Mobile: drawer bottom-up.
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
              label="Status de leitura"
              icon={BookOpenIcon}
              iconColor="text-gold"
            >
              <CheckboxList
                options={STATUS_OPTIONS}
                selected={statuses}
                onToggle={(v) => toggleListItem("status", statuses, v)}
              />
            </FilterGroup>

            <FilterGroup
              label="Acervo"
              icon={ArchiveBoxIcon}
              iconColor="text-moss"
            >
              <CheckboxList
                options={OWNERSHIP_OPTIONS}
                selected={ownerships}
                onToggle={(v) => toggleListItem("ownership", ownerships, v)}
              />
            </FilterGroup>

            <FilterGroup
              label="Período de leitura"
              icon={CalendarDaysIcon}
              iconColor="text-navy"
            >
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    aria-label="Ano"
                    value={year ? String(year) : ""}
                    onChange={(e) =>
                      setParam({
                        year: e.target.value || null,
                        month: e.target.value ? sp.get("month") : null,
                      })
                    }
                    options={yearsAvailable.map((y) => ({
                      value: String(y),
                      label: String(y),
                    }))}
                    placeholder="Ano"
                  />
                  <Select
                    aria-label="Mês"
                    value={month ? String(month) : ""}
                    onChange={(e) =>
                      setParam({ month: e.target.value || null })
                    }
                    options={MONTHS.map((m, i) => ({
                      value: String(i + 1),
                      label: m,
                    }))}
                    placeholder="Mês"
                    disabled={!year}
                  />
                </div>
                <p className="text-xs italic text-ink-fade">
                  Mês opcional · ano sozinho lista o ano todo
                </p>
                {(year || month) && (
                  <button
                    type="button"
                    onClick={() => setParam({ year: null, month: null })}
                    className="text-xs text-ink-soft underline hover:text-ink-deep transition-colors"
                  >
                    Limpar período
                  </button>
                )}
              </div>
            </FilterGroup>

            <FilterGroup
              label="Formato"
              icon={RectangleStackIcon}
              iconColor="text-cappuccino"
            >
              <CheckboxList
                options={FORMAT_OPTIONS}
                selected={formats}
                onToggle={(v) => toggleListItem("format", formats, v)}
              />
            </FilterGroup>

            <FilterGroup
              label="Por autor"
              icon={UserCircleIcon}
              iconColor="text-burgundy"
            >
              <SearchableCheckboxList
                options={allAuthors.map((a) => ({
                  value: a.slug,
                  label: a.name,
                }))}
                selected={authorSlugs}
                onToggle={(v) => toggleListItem("author", authorSlugs, v)}
                searchPlaceholder="Buscar autor…"
                emptyText="Nenhum autor cadastrado ainda."
              />
            </FilterGroup>
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
                className="w-4 h-4 rounded border-border text-ink-deep focus:ring-gold/30"
              />
              <span>{o.label}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
