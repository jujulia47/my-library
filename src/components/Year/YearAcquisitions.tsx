"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBagIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { HomeCard, HomeCardEmpty } from "@/components/Home/HomeCard";
import { BookCoverFallback } from "@/components/ui";
import { labelForPurchaseOrigin } from "@/utils/labels";
import { AcquisitionsModal } from "./AcquisitionsModal";
import type { AcquisitionsBreakdown } from "@/services/yearData";

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
    timeZone: "UTC",
  }).format(d);
}

type Props = {
  acquisitions: AcquisitionsBreakdown;
  year: number;
};

const INLINE_LIMIT = 5;

export function YearAcquisitions({ acquisitions, year }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  if (acquisitions.total_count === 0) {
    return (
      <HomeCard
        title="Aquisições"
        icon={<ShoppingBagIcon className="w-3.5 h-3.5" />}
        iconColor="#BC6E48"
      >
        <HomeCardEmpty>Nenhum livro adquirido este ano.</HomeCardEmpty>
      </HomeCard>
    );
  }

  // items já vem ordenado por acquired_at desc do service.
  const inlineItems = acquisitions.items.slice(0, INLINE_LIMIT);
  const hasMore = acquisitions.items.length > INLINE_LIMIT;

  // Maior count vira referência pro tamanho proporcional das barras.
  const maxCount = Math.max(...acquisitions.by_origin.map((o) => o.count), 1);

  return (
    <>
      <HomeCard
        title="Aquisições"
        icon={<ShoppingBagIcon className="w-3.5 h-3.5" />}
        iconColor="#BC6E48"
      >
        <p className="text-xs text-ink-fade italic -mt-1 mb-2">
          {acquisitions.total_count}{" "}
          {acquisitions.total_count === 1 ? "livro novo" : "livros novos"}
          {acquisitions.total_spent !== null && acquisitions.total_spent > 0 && (
            <> · {formatBRL(acquisitions.total_spent)} total</>
          )}
        </p>

        {/* Chips por origem (mantido) */}
        <ul className="space-y-1.5">
          {acquisitions.by_origin.map((entry) => {
            const widthPct = (entry.count / maxCount) * 100;
            return (
              <li
                key={entry.origin}
                className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-xs"
              >
                <span className="text-ink-soft">
                  {labelForPurchaseOrigin(entry.origin)}
                </span>
                <span
                  className="h-1.5 rounded-full bg-paper overflow-hidden"
                  aria-hidden
                >
                  <span
                    className="block h-full rounded-full bg-cappuccino"
                    style={{ width: `${widthPct}%` }}
                  />
                </span>
                <span className="font-body text-ink-deep tabular-nums">
                  {entry.count}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Lista compacta dos N mais recentes (sessão 17.2.5) */}
        <div className="mt-4 pt-3 border-t border-paper-soft">
          <ul className="space-y-1.5">
            {inlineItems.map((it) => (
              <li key={it.id}>
                <Link
                  href={`/book/${it.slug}`}
                  className="flex items-center gap-2 -mx-1 px-1 py-1 rounded hover:bg-paper-soft/50 transition-colors"
                >
                  <div
                    className="relative flex-shrink-0 w-7 h-9 rounded-sm overflow-hidden border border-ink-deep/15"
                    style={{ aspectRatio: "2 / 3" }}
                  >
                    <BookCoverFallback
                      title={it.title}
                      size="sm"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="text-ink-deep truncate">{it.title}</p>
                    <p className="text-ink-fade italic truncate text-[10px]">
                      {it.author_name ?? "—"}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right text-[10px] text-ink-fade">
                    <span className="font-mono">
                      {formatShortDate(it.acquired_at)}
                    </span>
                    {it.purchase_price !== null && (
                      <span className="block text-ink-soft">
                        {formatBRL(it.purchase_price)}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {hasMore && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-gold-deep hover:text-ink-deep py-1.5 transition-colors"
            >
              Ver todos os {acquisitions.total_count}
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </HomeCard>

      <AcquisitionsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        year={year}
        acquisitions={acquisitions}
      />
    </>
  );
}
