"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { imagesUrl } from "@/services/images";
import type { SerieListBook } from "@/services/serieList";

type Props = {
  books: SerieListBook[];
  /** Total declarado de volumes; usado pra preencher slots vazios. */
  qtyVolumes: number | null;
  /** Id da série — usado em links de "adicionar volume X". */
  serieId: string;
  /** Slug da série — usado pra `?from=` ao linkar pro form do livro. */
  serieSlug: string;
  /** Id do livro atualmente em leitura/pausada — recebe destaque "Leitura atual". */
  currentReadingBookId?: string | null;
  /** Id do próximo livro a ler quando nada está em andamento — recebe label "Próximo". */
  nextToReadBookId?: string | null;
};

type DerivedStatus = "reading" | "paused" | "finished" | "abandoned" | "tbr";

type Slot =
  | {
      kind: "book";
      key: string;
      book: SerieListBook;
      derivedStatus: DerivedStatus;
      finishedCount: number;
    }
  | { kind: "placeholder"; key: string; volumeNumber: number };

const STATUS_LABEL: Record<DerivedStatus, string> = {
  reading: "Lendo",
  paused: "Pausado",
  finished: "Lido",
  abandoned: "Abandonado",
  tbr: "Quero ler",
};

const STATUS_COLOR: Record<DerivedStatus, string> = {
  reading: "text-gold-deep",
  paused: "text-olive",
  finished: "text-moss",
  abandoned: "text-burgundy",
  tbr: "text-ink-fade",
};

function pickDerivedStatus(book: SerieListBook): {
  status: DerivedStatus;
  finishedCount: number;
} {
  const sorted = [...book.readings].sort((a, b) => {
    const af = a.finish_date ?? "";
    const bf = b.finish_date ?? "";
    if (af !== bf) return bf.localeCompare(af);
    const as = a.start_date ?? "";
    const bs = b.start_date ?? "";
    return bs.localeCompare(as);
  });
  const finishedCount = book.readings.filter((r) => r.status === "finished").length;
  const last = sorted[0];
  if (!last) return { status: "tbr", finishedCount };
  return {
    status: last.status as "reading" | "paused" | "finished" | "abandoned",
    finishedCount,
  };
}

function buildSlots(books: SerieListBook[], qtyVolumes: number | null): Slot[] {
  const slots: Slot[] = books.map((b) => {
    const { status, finishedCount } = pickDerivedStatus(b);
    return {
      kind: "book" as const,
      key: `book-${b.id}`,
      book: b,
      derivedStatus: status as DerivedStatus,
      finishedCount,
    };
  });

  // Quantos placeholders adicionar pra completar qtyVolumes.
  if (qtyVolumes && qtyVolumes > books.length) {
    const usedVolumes = new Set(
      books
        .map((b) => b.volume)
        .filter((v): v is number => typeof v === "number"),
    );
    const missing: number[] = [];
    for (let v = 1; v <= qtyVolumes; v += 1) {
      if (!usedVolumes.has(v)) missing.push(v);
    }
    // Se livros não têm volume informado, ainda assim queremos completar até
    // qtyVolumes — usa números a partir do total já cadastrado.
    while (slots.length + missing.length < qtyVolumes) {
      missing.push(slots.length + missing.length + 1);
    }
    for (const v of missing) {
      slots.push({ kind: "placeholder", key: `ph-${v}`, volumeNumber: v });
    }
  }

  return slots;
}

/**
 * Visíveis por breakpoint:
 * - mobile (default): 3
 * - sm (640+):        5
 * - lg (1024+):       7
 * Detectamos por matchMedia em vez de classes CSS porque o cálculo de
 * "quantas páginas existem" e "qual o offset de translate" precisa do número.
 */
function useVisibleCount() {
  const [count, setCount] = useState(7);
  useEffect(() => {
    const lg = window.matchMedia("(min-width: 1024px)");
    const sm = window.matchMedia("(min-width: 640px)");
    const apply = () => {
      if (lg.matches) setCount(7);
      else if (sm.matches) setCount(5);
      else setCount(3);
    };
    apply();
    lg.addEventListener("change", apply);
    sm.addEventListener("change", apply);
    return () => {
      lg.removeEventListener("change", apply);
      sm.removeEventListener("change", apply);
    };
  }, []);
  return count;
}

export default function SerieCarousel({
  books,
  qtyVolumes,
  serieId,
  serieSlug,
  currentReadingBookId = null,
  nextToReadBookId = null,
}: Props) {
  const slots = useMemo(() => buildSlots(books, qtyVolumes), [books, qtyVolumes]);
  const visible = useVisibleCount();
  const totalPages = Math.max(1, Math.ceil(slots.length / visible));
  const [page, setPage] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // Drag/swipe state — só ativa no mobile/tablet (touch).
  const dragRef = useRef<{ startX: number; lastX: number } | null>(null);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    dragRef.current = { startX: e.clientX, lastX: e.clientX };
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current.lastX = e.clientX;
  };
  const handlePointerUp = () => {
    if (!dragRef.current) return;
    const delta = dragRef.current.lastX - dragRef.current.startX;
    dragRef.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) setPage((p) => Math.min(totalPages - 1, p + 1));
    else setPage((p) => Math.max(0, p - 1));
  };

  const showArrows = totalPages > 1;
  // Translate por página inteira (visible itens cada).
  const translatePercent = -(page * 100);

  return (
    <div className="relative">
      {/* Track viewport */}
      <div
        ref={trackRef}
        className="overflow-hidden touch-pan-y"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${translatePercent}%)` }}
        >
          {slots.map((slot) => (
            <div
              key={slot.key}
              className="shrink-0 px-1.5"
              style={{ width: `${100 / visible}%` }}
            >
              {slot.kind === "book" ? (
                <BookSlot
                  book={slot.book}
                  status={slot.derivedStatus}
                  finishedCount={slot.finishedCount}
                  highlight={
                    slot.book.id === currentReadingBookId
                      ? "current"
                      : slot.book.id === nextToReadBookId
                        ? "next"
                        : null
                  }
                />
              ) : (
                <PlaceholderSlot
                  volumeNumber={slot.volumeNumber}
                  serieId={serieId}
                  serieSlug={serieSlug}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Setas */}
      {showArrows && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPage((p) => Math.max(0, p - 1));
            }}
            disabled={page === 0}
            aria-label="Anterior"
            className={clsx(
              "absolute -left-3 top-[42%] -translate-y-1/2 z-10",
              "w-7 h-7 rounded-full bg-ivory-light border border-border",
              "flex items-center justify-center text-ink-soft transition-colors",
              "hover:border-gold hover:text-ink-deep",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border",
            )}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPage((p) => Math.min(totalPages - 1, p + 1));
            }}
            disabled={page >= totalPages - 1}
            aria-label="Próximo"
            className={clsx(
              "absolute -right-3 top-[42%] -translate-y-1/2 z-10",
              "w-7 h-7 rounded-full bg-ivory-light border border-border",
              "flex items-center justify-center text-ink-soft transition-colors",
              "hover:border-gold hover:text-ink-deep",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border",
            )}
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dot indicator */}
      {totalPages > 1 && (
        <div
          className="flex justify-center gap-1 mt-3"
          aria-hidden="true"
        >
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPage(i);
              }}
              aria-label={`Ir pra página ${i + 1}`}
              className={clsx(
                "h-1.5 rounded-full transition-all duration-150",
                i === page
                  ? "w-[18px] bg-ink-deep"
                  : "w-1.5 bg-paper-soft border border-border",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BookSlot({
  book,
  status,
  finishedCount,
  highlight,
}: {
  book: SerieListBook;
  status: DerivedStatus;
  finishedCount: number;
  highlight: "current" | "next" | null;
}) {
  const labelBase = STATUS_LABEL[status];
  const colorClass = STATUS_COLOR[status];
  const reread = status === "finished" && finishedCount > 1;
  const label = status === "finished"
    ? reread
      ? `★ Lido (${finishedCount}x)`
      : "★ Lido"
    : labelBase;

  return (
    <a
      href={`/book/${book.slug}`}
      onClick={(e) => e.stopPropagation()}
      className="block group/slot"
    >
      <div
        className={clsx(
          "relative w-full overflow-hidden rounded-md border bg-paper transition-colors",
          highlight === "current"
            ? "border-gold ring-2 ring-gold/30"
            : "border-ink-deep/20 group-hover/slot:border-gold",
        )}
        style={{ aspectRatio: "2 / 3" }}
      >
        {book.cover ? (
          <Image
            src={imagesUrl(book.cover)}
            alt={`Capa de ${book.title}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 110px"
          />
        ) : (
          <VolumeFallback volumeNumber={book.volume} />
        )}
      </div>
      <p
        className={clsx(
          "mt-1.5 text-sm text-center font-body italic leading-tight line-clamp-1",
          highlight === "current"
            ? "text-gold-deep font-medium"
            : highlight === "next"
              ? "text-ink-soft font-medium"
              : colorClass,
        )}
      >
        {highlight === "current"
          ? "Leitura atual"
          : highlight === "next"
            ? "Próximo"
            : label}
      </p>
    </a>
  );
}

function PlaceholderSlot({
  volumeNumber,
  serieId,
  serieSlug,
}: {
  volumeNumber: number;
  serieId: string;
  serieSlug: string;
}) {
  return (
    <a
      href={`/book/new?serie_id=${serieId}&volume=${volumeNumber}&from=/serie/${serieSlug}`}
      onClick={(e) => e.stopPropagation()}
      className="block group/slot opacity-50 hover:opacity-80 transition-opacity"
    >
      <div
        className="relative w-full overflow-hidden rounded-md border border-dashed border-border bg-paper-soft flex items-center justify-center"
        style={{ aspectRatio: "2 / 3" }}
      >
        <span className="font-display text-2xl font-medium text-ink-fade">
          #{volumeNumber}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-center font-body italic text-ink-fade leading-tight">
        Não cadastrado
      </p>
    </a>
  );
}

function VolumeFallback({ volumeNumber }: { volumeNumber: number | null }) {
  // Quando o livro existe mas não tem capa, mostramos o NÚMERO do volume
  // em vez da inicial — ajuda a localizar visualmente "qual é o vol 4".
  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-cappuccino"
      role="img"
      aria-label="Volume sem capa"
    >
      <span className="font-display italic font-medium text-3xl text-gold leading-none">
        {volumeNumber ?? "?"}
      </span>
    </div>
  );
}
