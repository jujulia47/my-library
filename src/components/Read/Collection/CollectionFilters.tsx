"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import clsx from "clsx";
import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  Squares2X2Icon,
  ClockIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";
import { Button, Select, Card, Badge } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui/Badge";

const TYPE_OPTIONS: { value: string; label: string; variant: BadgeVariant }[] = [
  { value: "shelf", label: "Estante", variant: "olive" },
  { value: "list", label: "Lista", variant: "moss" },
  { value: "challenge", label: "Desafio", variant: "gold" },
  { value: "subscription", label: "Assinatura", variant: "terracota" },
];

const STATUS_OPTIONS: { value: string; label: string; variant: BadgeVariant }[] = [
  { value: "active", label: "Em andamento", variant: "gold" },
  { value: "completed", label: "Completas", variant: "moss" },
  { value: "archived", label: "Arquivadas", variant: "fade" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mais recente" },
  { value: "name_asc", label: "Nome (A-Z)" },
  { value: "type_asc", label: "Tipo (A-Z)" },
  { value: "progress_desc", label: "Progresso (maior)" },
  { value: "progress_asc", label: "Progresso (menor)" },
];

function parseList(v: string | null): string[] {
  if (!v) return [];
  return v.split(",").map((x) => x.trim()).filter(Boolean);
}

export type CollectionFiltersProps = {
  providersAvailable: string[];
};

export default function CollectionFilters({
  providersAvailable,
}: CollectionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const types = parseList(sp.get("type"));
  const statuses = parseList(sp.get("status"));
  const providers = parseList(sp.get("provider"));
  const sort = sp.get("sort") ?? "newest";

  const [panelOpen, setPanelOpen] = useState(false);

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
    setParam({ type: null, status: null, provider: null });
  };

  const showProviders = types.includes("subscription");

  const activeCount = types.length + statuses.length + providers.length;

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
  for (const p of providers) {
    activeChips.push({
      key: `provider:${p}`,
      label: p,
      variant: "terracota",
      onRemove: () => removeListItem("provider", providers, p),
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
              label="Tipo"
              icon={Squares2X2Icon}
              iconColor="text-moss"
            >
              <CheckboxList
                options={TYPE_OPTIONS}
                selected={types}
                onToggle={(v) => toggleListItem("type", types, v)}
              />
            </FilterGroup>

            <FilterGroup
              label="Status"
              icon={ClockIcon}
              iconColor="text-gold"
            >
              <CheckboxList
                options={STATUS_OPTIONS}
                selected={statuses}
                onToggle={(v) => toggleListItem("status", statuses, v)}
              />
              <p className="text-xs italic text-ink-fade mt-2">
                Sem filtro: mostra ativas e completas. Arquivadas só aparecem
                quando selecionadas.
              </p>
            </FilterGroup>

            {showProviders && providersAvailable.length > 0 && (
              <FilterGroup
                label="Provedor (assinatura)"
                icon={BuildingStorefrontIcon}
                iconColor="text-terracota"
              >
                <CheckboxList
                  options={providersAvailable.map((p) => ({
                    value: p,
                    label: p,
                  }))}
                  selected={providers}
                  onToggle={(v) => toggleListItem("provider", providers, v)}
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
