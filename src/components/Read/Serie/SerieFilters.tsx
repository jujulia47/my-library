"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import clsx from "clsx";
import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  BookOpenIcon,
  ChartBarIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";
import { Button, Select, Card, Badge } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui/Badge";
import SearchableCheckboxList from "@/components/Read/_shared/SearchableCheckboxList";

const STATUS_OPTIONS: { value: string; label: string; variant: BadgeVariant }[] = [
  { value: "tbr", label: "Quero ler", variant: "fade" },
  { value: "reading", label: "Lendo", variant: "gold" },
  { value: "paused", label: "Pausada", variant: "olive" },
  { value: "finished", label: "Concluída", variant: "moss" },
  { value: "abandoned", label: "Abandonada", variant: "burgundy" },
];

const PROGRESS_OPTIONS: { value: string; label: string; variant: BadgeVariant }[] = [
  { value: "not_started", label: "Não comecei", variant: "fade" },
  { value: "in_progress", label: "Em curso", variant: "gold" },
  { value: "completed", label: "Completas", variant: "moss" },
];

const SORT_OPTIONS = [
  { value: "reading_first", label: "Lendo" },
  { value: "last_activity_desc", label: "Atividade recente" },
  { value: "started_asc", label: "Mais antiga começada" },
  { value: "name_asc", label: "Nome (A-Z)" },
  { value: "name_desc", label: "Nome (Z-A)" },
  { value: "qty_volumes_asc", label: "Menos volumes" },
  { value: "qty_volumes_desc", label: "Mais volumes" },
];

function parseList(v: string | null): string[] {
  if (!v) return [];
  return v.split(",").map((x) => x.trim()).filter(Boolean);
}

export type SerieFiltersProps = {
  /** Todas as séries do usuário pra alimentar o filtro "Por série". */
  allSeries: { id: string; slug: string; name: string }[];
};

export default function SerieFilters({ allSeries }: SerieFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const statuses = parseList(sp.get("status"));
  const progress = parseList(sp.get("progress"));
  const serieSlugs = parseList(sp.get("serie"));
  const sort = sp.get("sort") ?? "reading_first";

  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (panelOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
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

  const clearAll = () =>
    setParam({ status: null, progress: null, serie: null });

  const activeCount = statuses.length + progress.length + serieSlugs.length;

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
  for (const p of progress) {
    const opt = PROGRESS_OPTIONS.find((x) => x.value === p);
    if (opt)
      activeChips.push({
        key: `progress:${p}`,
        label: opt.label,
        variant: opt.variant,
        onRemove: () => removeListItem("progress", progress, p),
      });
  }
  for (const slug of serieSlugs) {
    const found = allSeries.find((s) => s.slug === slug);
    if (found)
      activeChips.push({
        key: `serie:${slug}`,
        label: found.name,
        variant: "fade",
        onRemove: () => removeListItem("serie", serieSlugs, slug),
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
              label="Status da série"
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
              label="Progresso"
              icon={ChartBarIcon}
              iconColor="text-terracota"
            >
              <CheckboxList
                options={PROGRESS_OPTIONS}
                selected={progress}
                onToggle={(v) => toggleListItem("progress", progress, v)}
              />
            </FilterGroup>

            <FilterGroup
              label="Por série"
              icon={Squares2X2Icon}
              iconColor="text-moss"
            >
              <SearchableCheckboxList
                options={allSeries.map((s) => ({
                  value: s.slug,
                  label: s.name,
                }))}
                selected={serieSlugs}
                onToggle={(v) => toggleListItem("serie", serieSlugs, v)}
                searchPlaceholder="Buscar série…"
                emptyText="Nenhuma série cadastrada ainda."
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
