"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import Modal from "@/components/forms/Modal";
import { BookCoverFallback } from "@/components/ui";
import { labelForPurchaseOrigin } from "@/utils/labels";
import type {
  AcquisitionItem,
  AcquisitionsBreakdown,
} from "@/services/yearData";
import type { Database } from "@/utils/typings/supabase";

type PurchaseOrigin = Database["public"]["Enums"]["purchase_origin"];

const MONTH_NAMES_PT = [
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

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

type Props = {
  open: boolean;
  onClose: () => void;
  year: number;
  acquisitions: AcquisitionsBreakdown;
};

/**
 * Modal "Ver todos" das aquisições do ano (sessão 17.2.5). Filtros
 * cumulativos (AND): origem × subscription × mês.
 *
 * Reseta os filtros toda vez que reabre — UX sensata pra "começar do zero".
 */
export function AcquisitionsModal({
  open,
  onClose,
  year,
  acquisitions,
}: Props) {
  const items = acquisitions.items;

  const [originsFilter, setOriginsFilter] = useState<Set<PurchaseOrigin>>(
    new Set(),
  );
  const [subFilter, setSubFilter] = useState<Set<string>>(new Set()); // subscription ids
  const [monthFilter, setMonthFilter] = useState<number | null>(null); // 1-12

  // Reset ao reabrir
  if (!open && (originsFilter.size > 0 || subFilter.size > 0 || monthFilter !== null)) {
    setOriginsFilter(new Set());
    setSubFilter(new Set());
    setMonthFilter(null);
  }

  // Origens disponíveis (que aparecem na lista do ano)
  const availableOrigins = useMemo(() => {
    const set = new Set<PurchaseOrigin>();
    for (const it of items) if (it.purchase_origin) set.add(it.purchase_origin);
    return [...set];
  }, [items]);

  // Subscriptions disponíveis (só se há aquisições com origem=assinatura)
  const availableSubs = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of items) {
      if (it.purchase_origin === "assinatura" && it.subscription) {
        map.set(it.subscription.id, it.subscription.name);
      }
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [items]);

  // Meses disponíveis (que tiveram aquisição)
  const availableMonths = useMemo(() => {
    const set = new Set<number>();
    for (const it of items) {
      const m = new Date(`${it.acquired_at}T00:00:00Z`).getUTCMonth() + 1;
      set.add(m);
    }
    return [...set].sort((a, b) => a - b);
  }, [items]);

  // Lista filtrada
  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (originsFilter.size > 0) {
        if (!it.purchase_origin || !originsFilter.has(it.purchase_origin)) {
          return false;
        }
      }
      if (subFilter.size > 0) {
        if (!it.subscription || !subFilter.has(it.subscription.id)) {
          return false;
        }
      }
      if (monthFilter !== null) {
        const m = new Date(`${it.acquired_at}T00:00:00Z`).getUTCMonth() + 1;
        if (m !== monthFilter) return false;
      }
      return true;
    });
  }, [items, originsFilter, subFilter, monthFilter]);

  const totalSpentFiltered = filtered.reduce(
    (acc, it) => acc + (it.purchase_price ?? 0),
    0,
  );

  const toggleOrigin = (o: PurchaseOrigin) => {
    setOriginsFilter((prev) => {
      const next = new Set(prev);
      if (next.has(o)) next.delete(o);
      else next.add(o);
      return next;
    });
  };
  const toggleSub = (id: string) => {
    setSubFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasActiveFilters =
    originsFilter.size > 0 || subFilter.size > 0 || monthFilter !== null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Aquisições de ${year}`}
      size="lg"
    >
      {/* Filtros */}
      <div className="space-y-3 mb-5">
        {availableOrigins.length > 1 && (
          <FilterRow label="Origem">
            {availableOrigins.map((o) => (
              <FilterChip
                key={o}
                active={originsFilter.has(o)}
                onClick={() => toggleOrigin(o)}
              >
                {labelForPurchaseOrigin(o)}
              </FilterChip>
            ))}
          </FilterRow>
        )}
        {availableSubs.length > 0 && (
          <FilterRow label="Assinatura">
            {availableSubs.map((s) => (
              <FilterChip
                key={s.id}
                active={subFilter.has(s.id)}
                onClick={() => toggleSub(s.id)}
              >
                {s.name}
              </FilterChip>
            ))}
          </FilterRow>
        )}
        {availableMonths.length > 1 && (
          <FilterRow label="Mês">
            {availableMonths.map((m) => (
              <FilterChip
                key={m}
                active={monthFilter === m}
                onClick={() =>
                  setMonthFilter((prev) => (prev === m ? null : m))
                }
              >
                {MONTH_NAMES_PT[m - 1].slice(0, 3)}
              </FilterChip>
            ))}
          </FilterRow>
        )}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setOriginsFilter(new Set());
              setSubFilter(new Set());
              setMonthFilter(null);
            }}
            className="text-xs text-gold-deep hover:text-ink-deep underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <p className="text-sm italic text-ink-fade text-center py-12">
          {hasActiveFilters
            ? "Nenhuma aquisição corresponde aos filtros selecionados."
            : "Sem aquisições neste ano."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((it) => (
            <li key={it.id}>
              <Link
                href={`/book/${it.slug}`}
                onClick={onClose}
                className="flex items-start gap-3 p-2 -mx-2 rounded-md hover:bg-paper-soft/50 transition-colors"
              >
                <div
                  className="relative flex-shrink-0 w-12 h-16 rounded-sm overflow-hidden border border-ink-deep/15"
                  style={{ aspectRatio: "2 / 3" }}
                >
                  {it.cover_url ? (
                    <Image
                      src={it.cover_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <BookCoverFallback
                      title={it.title}
                      size="sm"
                      className="w-full h-full"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm text-ink-deep leading-tight line-clamp-2">
                    {it.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px] text-ink-fade">
                    {it.author_name && (
                      <span className="italic">{it.author_name}</span>
                    )}
                    {it.purchase_origin && (
                      <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-terracota/10 text-terracota">
                        {labelForPurchaseOrigin(it.purchase_origin)}
                      </span>
                    )}
                    {it.subscription && (
                      <span className="italic text-cappuccino">
                        · {it.subscription.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[11px] text-ink-fade font-mono">
                    {formatShortDate(it.acquired_at)}
                  </p>
                  {it.purchase_price !== null && (
                    <p className="text-xs text-ink-deep mt-0.5">
                      {formatBRL(it.purchase_price)}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Footer count */}
      <div className="mt-5 pt-3 border-t border-border flex justify-between items-center text-xs text-ink-soft">
        <span>
          Mostrando {filtered.length} de {items.length}
          {totalSpentFiltered > 0 && ` · ${formatBRL(totalSpentFiltered)}`}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-gold-deep hover:text-ink-deep underline"
        >
          Fechar
        </button>
      </div>
    </Modal>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider text-ink-fade min-w-[5rem]">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
        active
          ? "bg-ink-deep text-ivory-light border-ink-deep"
          : "bg-ivory-light text-ink-soft border-border hover:border-gold hover:text-ink-deep"
      }`}
    >
      {children}
    </button>
  );
}
