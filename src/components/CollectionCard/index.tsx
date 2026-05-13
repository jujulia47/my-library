"use client";

import Link from "next/link";
import clsx from "clsx";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PencilSquareIcon,
  TrashIcon,
  ArchiveBoxArrowDownIcon,
  ArchiveBoxXMarkIcon,
  StarIcon as StarOutlineIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import {
  Badge,
  CollectionTypeBadge,
  ConfirmDialog,
} from "@/components/ui";
import type { CollectionListItem } from "@/services/collectionList";
import { deleteCollection } from "@/actions/deleteCollection";
import { archiveCollection } from "@/actions/archiveCollection";
import { toggleCollectionFavorite } from "@/actions/toggleCollectionFavorite";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatSubMonth(iso: string): string {
  const d = new Date(iso);
  const month = d.toLocaleDateString("pt-BR", {
    month: "short",
    timeZone: "UTC",
  });
  // "set." → "Set"
  const monthClean = month.replace(".", "");
  const cap = monthClean.charAt(0).toUpperCase() + monthClean.slice(1);
  const y = String(d.getUTCFullYear()).slice(-2);
  return `${cap}/${y}`;
}

function dateRangeRaw(
  start: string | null,
  end: string | null,
): string | null {
  if (start && end) return `${formatShortDate(start)} → ${formatShortDate(end)}`;
  if (start) return `desde ${formatShortDate(start)}`;
  if (end) return `até ${formatShortDate(end)}`;
  return null;
}

/**
 * "Ritmo" do desafio. Compara percentual de tempo decorrido vs percentual lido.
 * - lido% >= tempo% - 5  → bom
 * - tempo% > lido% + 15  → atrasado
 * - senão                 → no ritmo
 * Retorna null se faltar goal_count, start_date ou end_date.
 */
function challengeRhythm(
  c: CollectionListItem,
): { label: string; variant: "moss" | "gold" | "burgundy" } | null {
  if (!c.goal_count || !c.start_date || !c.end_date) return null;
  const start = new Date(c.start_date).getTime();
  const end = new Date(c.end_date).getTime();
  const now = Date.now();
  if (end <= start) return null;
  const totalMs = end - start;
  const elapsedMs = Math.max(0, Math.min(totalMs, now - start));
  const timePct = (elapsedMs / totalMs) * 100;
  const readPct = (c.read_count / c.goal_count) * 100;
  if (readPct >= timePct - 5)
    return { label: "Ritmo bom", variant: "moss" };
  if (timePct > readPct + 15)
    return { label: "Atrasada", variant: "burgundy" };
  return { label: "No ritmo", variant: "gold" };
}

/**
 * Lista de meses entre start_date e hoje. Usado em cards de assinatura.
 * Retorna no máximo 4 itens (3 mais recentes + indicador de "+N meses").
 */
function subscriptionMonths(start: string): {
  visible: string[];
  more: number;
} {
  const startDate = new Date(start);
  const now = new Date();
  const months: Date[] = [];
  const cursor = new Date(
    Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1),
  );
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  while (cursor <= end && months.length < 60) {
    months.push(new Date(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  if (months.length <= 3) {
    return { visible: months.map((d) => formatSubMonth(d.toISOString())), more: 0 };
  }
  // Mais recentes primeiro: pega os últimos 3.
  const lastThree = months.slice(-3).reverse();
  return {
    visible: lastThree.map((d) => formatSubMonth(d.toISOString())),
    more: months.length - 3,
  };
}

type Props = {
  collection: CollectionListItem;
};

export default function CollectionCard({ collection: c }: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Estado otimista da estrela: inicia com o valor do server, atualiza
  // imediatamente ao clicar (revert no erro). Loading flag separa "togglando"
  // de "deletando" (ambos usam isPending).
  const [favorite, setFavorite] = useState(c.is_favorite);
  const [favPending, setFavPending] = useState(false);
  // Hover da estrela — preview outline → solid (mesmo pattern do BookCard
  // heart). CSS-only com group-hover não funciona consistente no Tailwind v4
  // com classes condicionais, então usa state explícito.
  const [starHover, setStarHover] = useState(false);

  const handleFavoriteToggle = async () => {
    const previous = favorite;
    setFavorite(!previous);
    setFavPending(true);
    const result = await toggleCollectionFavorite(c.id);
    setFavPending(false);
    if (!result.ok) {
      setFavorite(previous);
      return;
    }
    router.refresh();
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteCollection(c.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    });
  };

  const handleArchive = () => {
    startTransition(async () => {
      await archiveCollection(c.id, !c.is_archived);
      router.refresh();
    });
  };

  // ------- Subtitle (varia por tipo) -------
  let subtitle: string | null = null;
  if (c.type === "shelf" || c.type === "list") {
    subtitle = c.description || null;
  } else if (c.type === "challenge") {
    const period =
      c.start_date && c.end_date
        ? `${formatShortDate(c.start_date)} → ${formatShortDate(c.end_date)}`
        : "";
    subtitle = `Meta: ${c.goal_count ?? "—"} livros${period ? ` · ${period}` : ""}`;
  } else if (c.type === "subscription") {
    const since = c.start_date ? `desde ${formatShortDate(c.start_date)}` : "";
    subtitle = c.provider
      ? `${c.provider}${since ? ` · ${since}` : ""}`
      : since || null;
  } else if (c.type === "wishlist") {
    subtitle = "Lista de desejos";
  }

  // Wishlist value annotation: prepend ao subtitle se há valor (não-wishlist
  // collection types — ainda pode haver items wishlist em coleções legadas).
  // Pra wishlist coleção, o valor estimado vai numa linha separada.
  if (
    c.type !== "wishlist" &&
    c.estimated_value !== null &&
    c.estimated_value > 0
  ) {
    const valueStr = `${formatBRL(c.estimated_value)} estimados`;
    subtitle = subtitle ? `${subtitle} · ${valueStr}` : valueStr;
  }

  // ------- Section chips -------
  const showSections = c.type !== "challenge";
  const sectionChips = showSections ? c.sections.slice(0, 5) : [];
  const moreSections =
    showSections && c.sections.length > 5 ? c.sections.length - 5 : 0;

  // ------- Subscription months chips -------
  const subMonths =
    c.type === "subscription" && c.start_date
      ? subscriptionMonths(c.start_date)
      : null;

  // ------- Progress line text -------
  let progressText: string;
  if (c.type === "challenge") {
    progressText = `${c.read_count} de ${c.goal_count ?? "—"} · ${Math.round(c.progress_percent)}%`;
  } else if (c.type === "wishlist") {
    const total = c.book_count + c.wishlist_count;
    progressText = `${c.book_count} de ${total} adquirido${total === 1 ? "" : "s"} · ${Math.round(c.progress_percent)}%`;
  } else if (c.type === "subscription") {
    const total = c.book_count + c.wishlist_count;
    progressText = `${total} livro${total === 1 ? "" : "s"} · ${c.read_count} lido${c.read_count === 1 ? "" : "s"} · ${Math.round(c.progress_percent)}%`;
  } else {
    const total = c.book_count + c.wishlist_count;
    progressText = `${total} livro${total === 1 ? "" : "s"} · ${c.read_count} lido${c.read_count === 1 ? "" : "s"} · ${Math.round(c.progress_percent)}%`;
  }

  // ------- Date row + rhythm -------
  const dateRow = dateRangeRaw(c.start_date, c.end_date);
  const rhythm = c.type === "challenge" ? challengeRhythm(c) : null;

  const progressBarColor = c.is_completed ? "bg-moss" : "bg-gold";

  return (
    <>
      <div
        className={clsx(
          "relative group rounded-lg",
          "border border-border bg-ivory-light",
          "shadow-[0_1px_2px_rgba(74,56,38,0.05),0_4px_12px_rgba(74,56,38,0.06)]",
          "transition-colors duration-150",
          "hover:border-gold",
          c.is_archived && "opacity-70",
        )}
      >
        <Link
          href={`/collection/${c.slug}`}
          className="block p-5 pr-12 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded-lg"
        >
          {/* Header: título + badge tipo */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-xl font-medium text-ink-deep leading-tight min-w-0">
              {c.name}
            </h3>
            <div className="flex-shrink-0 flex items-center gap-1.5">
              {c.is_archived && (
                <Badge variant="fade" size="sm">
                  Arquivada
                </Badge>
              )}
              <CollectionTypeBadge type={c.type} />
            </div>
          </div>

          {subtitle && (
            <p className="font-body text-sm text-ink-soft italic mt-1 line-clamp-2">
              {subtitle}
            </p>
          )}

          {/* Section chips */}
          {sectionChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {sectionChips.map((s) => (
                <span
                  key={s.name}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-paper-soft text-ink-soft px-2 py-0.5 text-[11px] font-body"
                >
                  {s.name} ({s.count})
                </span>
              ))}
              {moreSections > 0 && (
                <span className="inline-flex items-center rounded-full border border-border bg-paper-soft text-ink-fade px-2 py-0.5 text-[11px] font-body italic">
                  +{moreSections}
                </span>
              )}
            </div>
          )}

          {/* Subscription month chips */}
          {subMonths && subMonths.visible.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {subMonths.visible.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center rounded-full border border-terracota/35 bg-terracota/[0.10] text-terracota px-2 py-0.5 text-[11px] font-body"
                >
                  {m}
                </span>
              ))}
              {subMonths.more > 0 && (
                <span className="inline-flex items-center rounded-full border border-border bg-paper-soft text-ink-fade px-2 py-0.5 text-[11px] font-body italic">
                  +{subMonths.more} {subMonths.more === 1 ? "mês" : "meses"}
                </span>
              )}
            </div>
          )}

          {/* Date raw + rhythm row (italic discreto) */}
          {(dateRow || rhythm) && (
            <p className="text-xs italic text-ink-fade mt-3">
              {rhythm && (
                <span className="text-ink-soft not-italic font-medium mr-2">
                  {rhythm.label}
                </span>
              )}
              {dateRow}
            </p>
          )}

          {/* Linha extra de valor estimado pra coleção wishlist */}
          {c.type === "wishlist" &&
            c.estimated_value !== null &&
            c.estimated_value > 0 && (
              <p className="text-xs italic text-ink-fade mt-1">
                {formatBRL(c.estimated_value)} estimados
              </p>
            )}

          {/* Progress line */}
          <div className="mt-4 flex items-center justify-between gap-3 text-sm font-body text-ink-soft">
            <span>{progressText}</span>
          </div>

          {/* Progress bar */}
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-paper overflow-hidden">
            <div
              className={clsx(
                "h-full rounded-full transition-all",
                progressBarColor,
              )}
              style={{ width: `${Math.max(0, Math.min(100, c.progress_percent))}%` }}
            />
          </div>
        </Link>

        {/* Ações do card: Editar, Arquivar, Excluir, Favoritar — todos no
            mesmo container com gap-1.5 e o padrão `.card-icon-btn`. Edit/
            arquivar/excluir só aparecem no hover; estrela fica sempre
            visível quando marcada. Background dos botões NÃO muda no
            hover; só o ícone escala (1.1) e a estrela troca outline→solid. */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          <Link
            href={`/collection/edit/${c.id}?from=/collection`}
            aria-label={`Editar ${c.name}`}
            onClick={(e) => e.stopPropagation()}
            className={clsx(
              "card-icon-btn cursor-pointer rounded-md bg-ivory-light/95 backdrop-blur-sm border border-border p-1.5 text-ink-soft",
              "hover:text-ink-deep",
              "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150",
            )}
          >
            <PencilSquareIcon className="w-4 h-4" />
          </Link>
          <button
            type="button"
            aria-label={c.is_archived ? "Desarquivar" : "Arquivar"}
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleArchive();
            }}
            className={clsx(
              "card-icon-btn cursor-pointer rounded-md bg-ivory-light/95 backdrop-blur-sm border border-border p-1.5 text-ink-soft",
              "hover:text-ink-deep",
              "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150",
            )}
          >
            {c.is_archived ? (
              <ArchiveBoxXMarkIcon className="w-4 h-4" />
            ) : (
              <ArchiveBoxArrowDownIcon className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            aria-label={`Excluir ${c.name}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setConfirmOpen(true);
            }}
            className={clsx(
              "card-icon-btn cursor-pointer rounded-md bg-ivory-light/95 backdrop-blur-sm border border-border p-1.5 text-burgundy",
              "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150",
            )}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label={
              favorite ? "Desmarcar como favorita" : "Marcar como favorita"
            }
            title={favorite ? "Favorita" : "Marcar como favorita"}
            aria-pressed={favorite}
            disabled={favPending}
            onMouseEnter={() => setStarHover(true)}
            onMouseLeave={() => setStarHover(false)}
            onFocus={() => setStarHover(true)}
            onBlur={() => setStarHover(false)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFavoriteToggle();
            }}
            className={clsx(
              "card-icon-btn cursor-pointer rounded-md p-1.5",
              "bg-ivory-light/95 backdrop-blur-sm border border-border",
              favorite || starHover ? "text-gold" : "text-ink-fade/60",
              !favorite &&
                "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
              favPending && "opacity-60 cursor-wait",
            )}
          >
            {favorite || starHover ? (
              <StarSolidIcon className="w-4 h-4" />
            ) : (
              <StarOutlineIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setError(null);
        }}
        onConfirm={handleDelete}
        title="Excluir coleção?"
        description={
          error
            ? error
            : `"${c.name}" será removida. Os items dentro da coleção também serão removidos (os livros em si não são afetados). Esta ação não pode ser desfeita.`
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={isPending}
      />
    </>
  );
}
