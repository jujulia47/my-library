"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  useFloating,
  useHover,
  useFocus,
  useDismiss,
  useInteractions,
  useTransitionStyles,
  flip,
  shift,
  offset,
  autoUpdate,
  FloatingPortal,
} from "@floating-ui/react";
import {
  PlusIcon,
  EllipsisHorizontalIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button, ConfirmDialog, RatingStars } from "@/components/ui";
import BibliographyEntryModal, {
  type BibliographyEntryInitial,
} from "@/components/forms/BibliographyEntryModal";
import { deleteBibliographyEntry } from "@/actions/deleteBibliographyEntry";
import type { BibliographyEntry } from "@/services/authorDetail";
import { useAuthorInteraction } from "./AuthorInteractionContext";

const ITEM_WIDTH = 110;
const ROW_HEIGHT = 170;
const PADDING = 24;
const CORNER_RADIUS = 30;
const CARD_WIDTH = 100;
const CARD_GAP = 12; // espaço entre card e linha do timeline

function formatMonthYear(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const m = d.toLocaleDateString("pt-BR", {
    month: "short",
    timeZone: "UTC",
  });
  return `${m.replace(".", "")}/${d.getUTCFullYear()}`;
}

function buildPath(numRows: number, totalWidth: number): string {
  if (numRows === 0) return "";
  const segments: string[] = [];
  const rightX = totalWidth - PADDING;
  const leftX = PADDING;
  for (let row = 0; row < numRows; row++) {
    const y = PADDING + row * ROW_HEIGHT + ROW_HEIGHT / 2;
    if (row % 2 === 0) {
      // Linha esquerda → direita. No row 0 começamos com M leftX y; nos
      // demais a caneta já chegou em leftX+CR pela curva, então só seguimos.
      if (row === 0) segments.push(`M ${leftX} ${y}`);
      segments.push(`L ${rightX - CORNER_RADIUS} ${y}`);
      if (row < numRows - 1) {
        segments.push(`Q ${rightX} ${y} ${rightX} ${y + CORNER_RADIUS}`);
        segments.push(`L ${rightX} ${y + ROW_HEIGHT - CORNER_RADIUS}`);
        segments.push(
          `Q ${rightX} ${y + ROW_HEIGHT} ${rightX - CORNER_RADIUS} ${y + ROW_HEIGHT}`,
        );
      }
    } else {
      // Linha direita → esquerda. Caneta já está em rightX-CR pela curva.
      segments.push(`L ${leftX + CORNER_RADIUS} ${y}`);
      if (row < numRows - 1) {
        segments.push(`Q ${leftX} ${y} ${leftX} ${y + CORNER_RADIUS}`);
        segments.push(`L ${leftX} ${y + ROW_HEIGHT - CORNER_RADIUS}`);
        segments.push(
          `Q ${leftX} ${y + ROW_HEIGHT} ${leftX + CORNER_RADIUS} ${y + ROW_HEIGHT}`,
        );
      }
    }
  }
  return segments.join(" ");
}

function positionFor(
  index: number,
  itemsPerRow: number,
  totalWidth: number,
): { x: number; y: number; isAbove: boolean } {
  const row = Math.floor(index / itemsPerRow);
  const colInRow = index % itemsPerRow;
  const isLeftToRight = row % 2 === 0;
  const span = totalWidth - PADDING * 2;
  const xRel = ((colInRow + 0.5) * span) / itemsPerRow;
  const x = isLeftToRight ? PADDING + xRel : totalWidth - PADDING - xRel;
  const y = PADDING + row * ROW_HEIGHT + ROW_HEIGHT / 2;
  const isAbove = row % 2 === 0;
  return { x, y, isAbove };
}

export type AuthorBibliographyTimelineProps = {
  entries: BibliographyEntry[];
  authorId: string;
};

export default function AuthorBibliographyTimeline({
  entries,
  authorId,
}: AuthorBibliographyTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [itemsPerRow, setItemsPerRow] = useState(5);
  const [containerWidth, setContainerWidth] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BibliographyEntry | null>(null);
  const { hoveredBookId } = useAuthorInteraction();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setContainerWidth(w);
      if (w < 500) setItemsPerRow(3);
      else if (w < 800) setItemsPerRow(4);
      else if (w < 1100) setItemsPerRow(5);
      else setItemsPerRow(6);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const numRows = Math.ceil(entries.length / itemsPerRow);
  const totalWidth = Math.max(
    containerWidth || itemsPerRow * ITEM_WIDTH + PADDING * 2,
    itemsPerRow * ITEM_WIDTH + PADDING * 2,
  );
  const totalHeight =
    numRows > 0 ? numRows * ROW_HEIGHT + PADDING * 2 : ROW_HEIGHT;
  const pathD = buildPath(numRows, totalWidth);

  return (
    <section className="my-10">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-2 border-b border-border">
        <h2 className="font-display text-xl font-medium text-ink-deep">
          Bibliografia
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={<PlusIcon className="w-4 h-4" />}
          onClick={() => setCreateOpen(true)}
        >
          Adicionar obra
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm italic text-ink-fade py-8 text-center">
          Nenhuma obra cadastrada ainda. Use &ldquo;Adicionar obra&rdquo; pra
          começar a montar a bibliografia.
        </p>
      ) : (
        <div ref={containerRef} className="w-full overflow-x-auto">
          <div
            className="relative"
            style={{ width: totalWidth, height: totalHeight }}
          >
            <svg
              className="absolute inset-0 pointer-events-none"
              viewBox={`0 0 ${totalWidth} ${totalHeight}`}
              width={totalWidth}
              height={totalHeight}
            >
              <defs>
                <linearGradient
                  id="timelineGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="var(--color-cappuccino-soft)" />
                  <stop offset="50%" stopColor="var(--color-gold)" />
                  <stop offset="100%" stopColor="var(--color-cappuccino-soft)" />
                </linearGradient>
              </defs>
              <path
                d={pathD}
                fill="none"
                stroke="url(#timelineGradient)"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {entries.map((entry, idx) => {
                const { x, y } = positionFor(idx, itemsPerRow, totalWidth);
                const isHovered =
                  entry.book_id !== null && hoveredBookId === entry.book_id;
                return entry.is_owned ? (
                  <g
                    key={`pt-${entry.id}`}
                    style={{
                      transform: isHovered ? `scale(1.6)` : "scale(1)",
                      transformOrigin: `${x}px ${y}px`,
                      transition: "transform 180ms ease-out",
                    }}
                  >
                    {isHovered && (
                      <circle
                        cx={x}
                        cy={y}
                        r={12}
                        fill="var(--color-gold)"
                        opacity={0.25}
                      />
                    )}
                    <circle cx={x} cy={y} r={7} fill="var(--color-gold)" />
                    <circle cx={x} cy={y} r={3} fill="var(--color-ivory-light)" />
                  </g>
                ) : (
                  <circle
                    key={`pt-${entry.id}`}
                    cx={x}
                    cy={y}
                    r={6}
                    fill="var(--color-paper)"
                    stroke="var(--color-cappuccino-soft)"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                  />
                );
              })}
            </svg>
            {entries.map((entry, idx) => {
              const { x, y, isAbove } = positionFor(
                idx,
                itemsPerRow,
                totalWidth,
              );
              const isExternallyHovered =
                entry.book_id !== null && hoveredBookId === entry.book_id;
              return (
                <BibliographyTimelineCard
                  key={entry.id}
                  entry={entry}
                  authorId={authorId}
                  x={x}
                  y={y}
                  isAbove={isAbove}
                  containerHeight={totalHeight}
                  onEdit={() => setEditTarget(entry)}
                  isExternallyHovered={isExternallyHovered}
                />
              );
            })}
          </div>
        </div>
      )}

      <BibliographyEntryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        authorId={authorId}
      />
      <BibliographyEntryModal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        authorId={authorId}
        initial={
          editTarget
            ? ({
                id: editTarget.id,
                title: editTarget.title,
                publication_year: editTarget.publication_year,
                notes: null,
              } satisfies BibliographyEntryInitial)
            : null
        }
      />
    </section>
  );
}

// =====================================================================
// BibliographyTimelineCard
//
// Bug fix do hover (sessão 13.4):
//   O floatingStyles do Floating UI usa `transform: translate(...)` pra
//   posicionar; o useTransitionStyles aplica `transform: scale(...)` pra
//   animar. Quando spread juntos no mesmo style, scale sobrescrevia
//   translate → popover renderizava em (0,0) da viewport. Fix: dois divs
//   aninhados — outer recebe floatingStyles (posição), inner recebe
//   transitionStyles (animação).
//
// Posicionamento do card pequeno (Fase 2 da 13.4):
//   Cards acima da linha (rows pares) usam `bottom` ancorado na linha
//   (cresce pra cima). Cards abaixo (rows ímpares) usam `top` ancorado
//   na linha (cresce pra baixo). Garante que mesmo com título em 2 linhas
//   o card nunca invade a linha do timeline.
// =====================================================================
function BibliographyTimelineCard({
  entry,
  authorId,
  x,
  y,
  isAbove,
  containerHeight,
  onEdit,
  isExternallyHovered,
}: {
  entry: BibliographyEntry;
  authorId: string;
  x: number;
  y: number;
  isAbove: boolean;
  containerHeight: number;
  onEdit: () => void;
  isExternallyHovered: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const cardRef = useRef<HTMLDivElement | null>(null);

  const isOwned = entry.is_owned;

  // Quando o livro é destacado a partir do histórico (hover externo) e o card
  // está fora da viewport, traz pra cena. `block: "center"` deixa visível sem
  // grudar na borda; só dispara se realmente precisa (checamos rect antes pra
  // evitar scroll desnecessário e jitter durante varreduras rápidas).
  useEffect(() => {
    if (!isExternallyHovered || !isOwned) return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const fullyVisible = rect.top >= 0 && rect.bottom <= vh;
    if (fullyVisible) return;
    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [isExternallyHovered, isOwned]);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: isAbove ? "top" : "bottom",
    middleware: [offset(12), flip(), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  });
  const hover = useHover(context, {
    enabled: isOwned,
    delay: { open: 150, close: 100 },
    move: false,
  });
  const focus = useFocus(context, { enabled: isOwned });
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
  ]);

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: 200,
    initial: { opacity: 0, transform: "scale(0.85)" },
  });

  const navigateHref = isOwned
    ? `/book/${entry.book_slug}`
    : `/book/new?title=${encodeURIComponent(entry.title)}&author_id=${authorId}`;

  const handleDelete = () => {
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteBibliographyEntry(entry.id);
      if (!result.ok) {
        setDeleteError(result.message);
        return;
      }
      setConfirmDelete(false);
      router.refresh();
    });
  };

  // Card pequeno ancorado pelo lado próximo à linha:
  //  - acima: usa `bottom` (cresce pra cima a partir da linha)
  //  - abaixo: usa `top` (cresce pra baixo a partir da linha)
  const cardPositionStyle: React.CSSProperties = isAbove
    ? {
        position: "absolute",
        left: x - CARD_WIDTH / 2,
        bottom: containerHeight - y + CARD_GAP,
        width: CARD_WIDTH,
      }
    : {
        position: "absolute",
        left: x - CARD_WIDTH / 2,
        top: y + CARD_GAP,
        width: CARD_WIDTH,
      };

  return (
    <>
      <div
        ref={(el) => {
          cardRef.current = el;
          refs.setReference(el);
        }}
        {...getReferenceProps()}
        className="group"
        style={cardPositionStyle}
      >
        <Link
          href={navigateHref}
          title={entry.title}
          className={clsx(
            "block text-center transition-transform duration-150",
            isOwned ? "opacity-100 hover:scale-105" : "opacity-50 hover:opacity-80",
            isExternallyHovered && isOwned && "scale-110",
          )}
        >
          <p
            className={clsx(
              "text-[10px] tracking-wide transition-colors",
              isExternallyHovered && isOwned
                ? "text-gold-deep font-medium"
                : "text-ink-fade",
            )}
          >
            {entry.publication_year ?? "—"}
          </p>
          <div
            className={clsx(
              "mt-1 px-2 py-1.5 rounded leading-tight transition-all",
              isOwned
                ? "border border-gold shadow-sm"
                : "border border-dashed",
              isExternallyHovered &&
                isOwned &&
                "ring-2 ring-gold ring-offset-2 ring-offset-ivory-light shadow-md",
            )}
            style={
              isOwned
                ? {
                    background: isExternallyHovered
                      ? "linear-gradient(135deg, var(--color-ivory-light) 0%, rgba(240, 192, 64, 0.35) 100%)"
                      : "linear-gradient(135deg, var(--color-ivory-light) 0%, rgba(240, 192, 64, 0.15) 100%)",
                    borderWidth: "1.5px",
                  }
                : {
                    borderColor: "var(--color-cappuccino-soft)",
                    color: "var(--color-cappuccino)",
                  }
            }
          >
            <p
              className="text-[10px] font-medium text-ink-deep"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.2,
              }}
            >
              {entry.title}
            </p>
          </div>
        </Link>

        {!isOwned && (
          <NotOwnedActions
            onEdit={onEdit}
            onDelete={() => setConfirmDelete(true)}
          />
        )}
      </div>

      {isOwned && isMounted && (
        <FloatingPortal>
          {/* Outer: posicionamento via floatingStyles (transform: translate) */}
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{ ...floatingStyles, zIndex: 60 }}
          >
            {/* Inner: animação via transitionStyles (transform: scale + opacity).
                Separados pra que scale não sobrescreva translate. */}
            <div style={transitionStyles}>
              <ExpandedCard entry={entry} />
            </div>
          </div>
        </FloatingPortal>
      )}

      {!isOwned && (
        <ConfirmDialog
          open={confirmDelete}
          onClose={() => {
            setConfirmDelete(false);
            setDeleteError(null);
          }}
          onConfirm={handleDelete}
          title="Excluir obra da bibliografia?"
          description={
            deleteError
              ? deleteError
              : `"${entry.title}" será removido da bibliografia. Os livros do autor (se houver) não são afetados.`
          }
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          variant="destructive"
        />
      )}
    </>
  );
}

function NotOwnedActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute -top-1 -right-1 z-10">
      <button
        type="button"
        aria-label="Ações da obra"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={clsx(
          "p-0.5 rounded-full bg-ivory-light/95 border border-border shadow-sm",
          "text-ink-soft hover:text-ink-deep transition-colors",
          "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
        )}
      >
        <EllipsisHorizontalIcon className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-32 rounded-md border border-border bg-ivory-light shadow-lg z-20">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              onEdit();
            }}
            className="flex items-center gap-1.5 w-full text-left px-2.5 py-1.5 text-xs text-ink-deep hover:bg-paper-soft transition-colors"
          >
            <PencilSquareIcon className="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
            className="flex items-center gap-1.5 w-full text-left px-2.5 py-1.5 text-xs text-burgundy hover:bg-burgundy/10 border-t border-border transition-colors"
          >
            <TrashIcon className="w-3.5 h-3.5" />
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}

function ExpandedCard({ entry }: { entry: BibliographyEntry }) {
  const status = entry.derived_status;
  const pct =
    entry.current_page && entry.pages_count
      ? Math.min(100, Math.round((entry.current_page / entry.pages_count) * 100))
      : null;

  return (
    <div className="w-[220px] rounded-md border border-border bg-ivory-light shadow-lg p-3 font-body">
      <p className="font-display text-sm font-medium text-ink-deep leading-tight">
        {entry.title}
      </p>
      {entry.publication_year && (
        <p className="text-xs italic text-ink-fade mt-0.5">
          {entry.publication_year}
        </p>
      )}

      <div className="mt-2 space-y-1 text-xs text-ink-soft">
        {status === "finished" && (
          <>
            <p>
              <span className="text-moss">✓</span> Lido
              {entry.finished_at && ` em ${formatMonthYear(entry.finished_at)}`}
            </p>
            {entry.rating !== null && entry.rating > 0 && (
              <RatingStars value={entry.rating} size="text-sm" />
            )}
          </>
        )}
        {status === "reading" && (
          <>
            <p>
              <span className="text-gold-deep">●</span> Lendo
              {entry.started_at && ` desde ${formatMonthYear(entry.started_at)}`}
            </p>
            {entry.current_page !== null && entry.pages_count && (
              <>
                <p>
                  pág {entry.current_page} / {entry.pages_count}
                  {pct !== null && ` · ${pct}%`}
                </p>
                <div className="h-1 w-full rounded-full bg-paper-soft overflow-hidden mt-1">
                  <div
                    className="h-full bg-gold"
                    style={{ width: `${pct ?? 0}%` }}
                  />
                </div>
              </>
            )}
          </>
        )}
        {status === "paused" && (
          <>
            <p>
              <span className="text-olive">◌</span> Pausado
              {entry.started_at && ` desde ${formatMonthYear(entry.started_at)}`}
            </p>
            {entry.current_page !== null && entry.pages_count && (
              <p>
                pág {entry.current_page} / {entry.pages_count}
              </p>
            )}
          </>
        )}
        {status === "abandoned" && (
          <p>
            <span className="text-burgundy">✗</span> Abandonado
            {entry.finished_at && ` em ${formatMonthYear(entry.finished_at)}`}
          </p>
        )}
        {status === "tbr" && (
          <>
            <p>
              <span className="text-ink-fade">○</span> Tenho desde{" "}
              {entry.acquired_at ? formatMonthYear(entry.acquired_at) : "—"}
            </p>
            {entry.in_collections.map((c) => (
              <p key={c} className="italic text-ink-fade">
                Em &ldquo;{c}&rdquo;
              </p>
            ))}
          </>
        )}
      </div>

      <Link
        href={`/book/${entry.book_slug}`}
        className="block mt-3 pt-2 border-t border-border text-xs text-gold-deep hover:text-ink-deep"
      >
        → ver detalhe
      </Link>
    </div>
  );
}
