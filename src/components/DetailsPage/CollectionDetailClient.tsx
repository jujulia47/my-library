"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  Card,
  Button,
  BackButton,
  ConfirmDialog,
  CollectionTypeBadge,
  Badge,
  StatusBadge,
  BookCoverFallback,
} from "@/components/ui";
import {
  EllipsisVerticalIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  ArchiveBoxArrowDownIcon,
  ArchiveBoxXMarkIcon,
  CheckIcon,
  StarIcon as StarOutlineIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { deleteCollection } from "@/actions/deleteCollection";
import { archiveCollection } from "@/actions/archiveCollection";
import { removeCollectionItem } from "@/actions/removeCollectionItem";
import { toggleCollectionFavorite } from "@/actions/toggleCollectionFavorite";
import { imagesUrl } from "@/services/images";
import AddCollectionItemModal from "@/components/forms/AddCollectionItemModal";
import SectionEditModal from "@/components/forms/SectionEditModal";
import type {
  CollectionDetailData,
  CollectionItem,
} from "@/services/collectionDetail";
import type { LegacyReadingStatus } from "@/components/ui/StatusBadge";

const UNSECTIONED = "__unsectioned__";

function formatBRL(value: number, withCents = false): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: withCents ? 2 : 0,
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

function formatMonthYear(iso: string): string {
  const d = new Date(iso);
  const m = d.toLocaleDateString("pt-BR", {
    month: "short",
    timeZone: "UTC",
  });
  return `${m.replace(".", "")}/${d.getUTCFullYear()}`;
}

function relativeFromNow(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return "hoje";
  if (diffDays === 1) return "há 1 dia";
  if (diffDays < 30) return `há ${diffDays} dias`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "há 1 mês";
  if (diffMonths < 12) return `há ${diffMonths} meses`;
  const diffYears = Math.floor(diffDays / 365);
  return diffYears === 1 ? "há 1 ano" : `há ${diffYears} anos`;
}

function dateRangeRaw(start: string | null, end: string | null): string | null {
  if (start && end) return `${formatShortDate(start)} → ${formatShortDate(end)}`;
  if (start) return `desde ${formatShortDate(start)}`;
  if (end) return `até ${formatShortDate(end)}`;
  return null;
}

function monthsBetween(startIso: string, endDate: Date): number {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return 0;
  let months =
    (endDate.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (endDate.getUTCMonth() - start.getUTCMonth());
  if (endDate.getUTCDate() < start.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

type Pace = "no ritmo" | "atrasada" | "adiantada";
function derivePace(
  goal: number | null,
  start: string | null,
  end: string | null,
  read: number,
): Pace | null {
  if (!goal || !start || !end) return null;
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  const now = Date.now();
  if (endMs <= startMs) return null;
  const total = endMs - startMs;
  const elapsed = Math.max(0, Math.min(total, now - startMs));
  const timePct = (elapsed / total) * 100;
  const readPct = (read / goal) * 100;
  if (readPct > timePct + 15) return "adiantada";
  if (timePct > readPct + 15) return "atrasada";
  return "no ritmo";
}

const PACE_VARIANT: Record<Pace, "moss" | "gold" | "burgundy"> = {
  "adiantada": "moss",
  "no ritmo": "gold",
  "atrasada": "burgundy",
};

function deadlineCopy(end: string): string {
  const today = new Date();
  const d = new Date(end);
  const utcToday = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const utcEnd = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const diffDays = Math.round((utcEnd - utcToday) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "vence hoje";
  if (diffDays > 0)
    return `faltam ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  const abs = Math.abs(diffDays);
  return `atrasada há ${abs} ${abs === 1 ? "dia" : "dias"}`;
}

type Props = {
  data: CollectionDetailData;
};

export default function CollectionDetailClient({ data }: Props) {
  const { collection: c, items, last_activity_at } = data;
  const router = useRouter();
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<CollectionItem | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState<{ section: string | null } | null>(
    null,
  );
  const [editingSection, setEditingSection] = useState<{
    name: string | null;
    count: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [favorite, setFavorite] = useState(c.is_favorite);
  const [favPending, setFavPending] = useState(false);

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

  // ----- Derivações pra stats -----
  const bookItems = items.filter((i) => i.kind === "book");
  const wishlistItems = items.filter((i) => i.kind === "wishlist");
  const totalItems = items.length;
  const readBooks = bookItems.filter(
    (i) => i.kind === "book" && i.book.derived_status === "finished",
  ).length;
  const purchasedFromWishlist = bookItems.filter(
    (i) => i.kind === "book" && i.was_wishlist,
  ).length;

  // Valor estimado: soma só dos items que ainda são wishlist (não inclui
  // adquiridos, que viraram books e perderam o estimated_price).
  const estimatedTotal = wishlistItems.reduce((acc, item) => {
    if (item.kind !== "wishlist") return acc;
    return acc + (item.wishlist.estimated_price ?? 0);
  }, 0);
  const wishlistWithPriceCount = wishlistItems.filter(
    (i) => i.kind === "wishlist" && i.wishlist.estimated_price !== null,
  ).length;
  const wishlistAvg =
    wishlistWithPriceCount > 0
      ? estimatedTotal / wishlistWithPriceCount
      : 0;

  // Item mais caro entre os wishlist pendentes (não-adquiridos).
  const mostExpensive = wishlistItems.reduce<{
    title: string;
    price: number;
  } | null>((acc, item) => {
    if (item.kind !== "wishlist") return acc;
    const price = item.wishlist.estimated_price;
    if (price === null || price === undefined) return acc;
    if (!acc || price > acc.price)
      return { title: item.wishlist.title, price };
    return acc;
  }, null);

  // Pra coleção wishlist, "completa" = todos os itens viraram book (was_wishlist=true).
  // Pra challenge, baseado em goal_count vs read.
  // Pra outros, livros lidos / total.
  const isWishlistCollection = c.type === "wishlist";
  const acquiredCount = purchasedFromWishlist;
  const progressDenominator = isWishlistCollection
    ? totalItems
    : c.type === "challenge"
      ? c.goal_count ?? 0
      : totalItems;
  const progressNumerator = isWishlistCollection ? acquiredCount : readBooks;
  const progressPercent =
    progressDenominator > 0
      ? Math.min(100, (progressNumerator / progressDenominator) * 100)
      : 0;
  const isCompleted = isWishlistCollection
    ? totalItems > 0 && acquiredCount === totalItems
    : c.type === "challenge"
      ? !!c.goal_count && readBooks >= c.goal_count
      : totalItems > 0 && readBooks === totalItems;

  // ----- Datas raw -----
  const dateRow = dateRangeRaw(c.start_date, c.end_date);

  // ----- Group items by section -----
  const grouped = useMemo(() => {
    const map = new Map<string, CollectionItem[]>();
    for (const item of items) {
      const key = item.section ?? UNSECTIONED;
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    // Sort: named sections alphabetically first, "unsectioned" last.
    const named = [...map.keys()]
      .filter((k) => k !== UNSECTIONED)
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    const ordered: { key: string; name: string | null; items: CollectionItem[] }[] = [];
    for (const k of named) {
      ordered.push({ key: k, name: k, items: map.get(k) ?? [] });
    }
    if (map.has(UNSECTIONED)) {
      ordered.push({
        key: UNSECTIONED,
        name: null,
        items: map.get(UNSECTIONED) ?? [],
      });
    }
    return ordered;
  }, [items]);

  const onlyUnsectioned =
    grouped.length === 1 && grouped[0]?.key === UNSECTIONED;

  // ----- Handlers -----
  const handleDelete = () => {
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteCollection(c.id);
      if (!result.ok) {
        setDeleteError(result.message);
        return;
      }
      router.push("/collection");
      router.refresh();
    });
  };

  const handleArchive = () => {
    startTransition(async () => {
      await archiveCollection(c.id, !c.is_archived);
      router.refresh();
    });
  };

  const handleRemoveItem = () => {
    if (!removeTarget) return;
    setRemoveError(null);
    startTransition(async () => {
      const result = await removeCollectionItem(removeTarget.item_id);
      if (!result.ok) {
        setRemoveError(result.message);
        return;
      }
      setRemoveTarget(null);
      router.refresh();
    });
  };

  // ----- Stats config (varia por tipo) -----
  const stats = buildStats({
    type: c.type,
    totalItems,
    readBooks,
    acquiredCount,
    progressPercent,
    isCompleted,
    bookCount: bookItems.length,
    wishlistCount: wishlistItems.length,
    goal: c.goal_count,
    start: c.start_date,
    end: c.end_date,
    lastActivity: last_activity_at,
    estimatedTotal,
    wishlistAvg,
    wishlistWithPriceCount,
    mostExpensive,
  });

  // Status do hero
  const heroStatusBadge = c.is_archived ? (
    <Badge variant="fade" size="sm">
      Arquivada
    </Badge>
  ) : isCompleted ? (
    <Badge variant="moss" size="sm">
      Completa
    </Badge>
  ) : (
    <Badge variant="gold" size="sm">
      Em curso
    </Badge>
  );

  return (
    <div className="font-body max-w-5xl mx-auto">
      <div className="mb-4">
        <BackButton fallback="/collection" />
      </div>

      {/* HERO */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 mb-6 border-b border-border">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <h1 className="font-display text-3xl md:text-4xl font-medium text-ink-deep">
              {c.name}
            </h1>
            <button
              type="button"
              aria-label={
                favorite ? "Desmarcar como favorita" : "Marcar como favorita"
              }
              title={favorite ? "Favorita" : "Marcar como favorita"}
              aria-pressed={favorite}
              disabled={favPending}
              onClick={handleFavoriteToggle}
              className={clsx(
                "mt-1 p-1 rounded-md transition-colors",
                favorite
                  ? "text-gold hover:text-gold-deep"
                  : "text-ink-fade/60 hover:text-ink-soft",
                favPending && "opacity-60 cursor-wait",
              )}
            >
              {favorite ? (
                <StarSolidIcon className="w-7 h-7" />
              ) : (
                <StarOutlineIcon className="w-7 h-7" />
              )}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <CollectionTypeBadge type={c.type} />
            {heroStatusBadge}
            {c.type === "subscription" && c.provider && (
              <Badge variant="terracota" size="sm">
                {c.provider}
              </Badge>
            )}
          </div>
          {c.description && (
            <p className="text-ink-soft italic mt-3">{c.description}</p>
          )}
          {dateRow && (
            <p className="text-xs italic text-ink-fade mt-2">{dateRow}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => setAddOpen({ section: null })}
          >
            Adicionar item
          </Button>
          <Button
            as="Link"
            href={`/collection/edit/${c.id}?from=/collection/${c.slug}`}
            variant="ghost"
            size="sm"
            leftIcon={<PencilSquareIcon className="w-4 h-4" />}
          >
            Editar
          </Button>
          <div className="relative">
            <button
              type="button"
              aria-label="Mais ações"
              onClick={() => setActionsOpen((o) => !o)}
              onBlur={() => setTimeout(() => setActionsOpen(false), 150)}
              className="p-2 rounded-md border border-border bg-ivory-light text-ink-soft hover:text-ink-deep hover:bg-paper-soft transition-colors"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {actionsOpen && (
              <div className="absolute right-0 mt-1 w-56 rounded-md border border-border bg-ivory-light shadow-lg z-20">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setActionsOpen(false);
                    handleArchive();
                  }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-ink-deep hover:bg-paper-soft transition-colors"
                >
                  {c.is_archived ? (
                    <>
                      <ArchiveBoxXMarkIcon className="w-4 h-4" />
                      Desarquivar
                    </>
                  ) : (
                    <>
                      <ArchiveBoxArrowDownIcon className="w-4 h-4" />
                      Arquivar
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setActionsOpen(false);
                    setConfirmOpen(true);
                  }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-burgundy hover:bg-burgundy/10 border-t border-border transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Excluir coleção
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, idx) => (
          <Card key={idx} size="sm">
            <p className="text-[11px] uppercase tracking-wider text-ink-fade">
              {s.label}
            </p>
            <p className="font-display text-2xl text-ink-deep mt-1">
              {s.value}
            </p>
            {s.bar && (
              <div className="mt-2 h-1.5 w-full rounded-full bg-paper overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full",
                    s.bar.complete ? "bg-moss" : "bg-gold",
                  )}
                  style={{ width: `${Math.max(0, Math.min(100, s.bar.percent))}%` }}
                />
              </div>
            )}
            {s.sub && (
              <p className="text-xs italic text-ink-fade mt-1">{s.sub}</p>
            )}
          </Card>
        ))}
      </div>

      {/* SECTIONS / ITEMS */}
      {items.length === 0 ? (
        <Card className="text-center py-12">
          <h2 className="font-display text-xl font-medium text-ink-deep mb-2">
            Sem items ainda
          </h2>
          <p className="text-ink-soft italic max-w-md mx-auto mb-4">
            Adicione livros que você já tem ou items da sua wishlist pra
            organizar essa coleção.
          </p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => setAddOpen({ section: null })}
          >
            Adicionar primeiro item
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => {
            const isUnsectioned = group.key === UNSECTIONED;
            return (
              <section key={group.key}>
                {/* Header da seção (suprime quando só há unsectioned) */}
                {!onlyUnsectioned && (
                  <div className="group flex items-center justify-between gap-3 mb-3 pb-2 border-b border-border">
                    <div className="flex items-center gap-2 min-w-0">
                      <h2 className="font-display text-lg font-medium text-ink-deep">
                        {isUnsectioned ? (
                          <span className="italic text-ink-soft">
                            Sem seção
                          </span>
                        ) : (
                          group.name
                        )}
                      </h2>
                      <span className="inline-flex items-center rounded-full border border-border bg-paper-soft text-ink-soft px-2 py-0.5 text-xs font-body">
                        {group.items.length}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingSection({
                            name: group.name,
                            count: group.items.length,
                          })
                        }
                        aria-label={
                          isUnsectioned
                            ? "Criar seção a partir destes items"
                            : `Renomear seção ${group.name}`
                        }
                        className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity p-1 rounded-md text-ink-soft hover:text-ink-deep hover:bg-paper-soft"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddOpen({ section: group.name })}
                      className="text-sm text-ink-soft hover:text-ink-deep underline transition-colors"
                    >
                      + Adicionar item
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {group.items.map((item) => (
                    <ItemCard
                      key={item.item_id}
                      item={item}
                      showMarkPurchased={isWishlistCollection}
                      onRemove={() => setRemoveTarget(item)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* MODAIS */}
      {addOpen && (
        <AddCollectionItemModal
          open={true}
          onClose={() => setAddOpen(null)}
          collectionId={c.id}
          collectionSlug={c.slug}
          collectionType={c.type}
          defaultSection={addOpen.section}
        />
      )}
      {editingSection && (
        <SectionEditModal
          open={true}
          onClose={() => setEditingSection(null)}
          collectionId={c.id}
          sectionName={editingSection.name}
          itemCount={editingSection.count}
        />
      )}

      {/* Confirmação de delete da coleção */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        title="Excluir coleção?"
        description={
          deleteError
            ? deleteError
            : `"${c.name}" será removida. Os items dentro da coleção também serão removidos (os livros em si não são afetados). Esta ação não pode ser desfeita.`
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={isPending}
      />

      {/* Confirmação de remover item */}
      <ConfirmDialog
        open={removeTarget !== null}
        onClose={() => {
          setRemoveTarget(null);
          setRemoveError(null);
        }}
        onConfirm={handleRemoveItem}
        title="Remover item da coleção?"
        description={
          removeError
            ? removeError
            : (() => {
                if (!removeTarget) return "";
                const title =
                  removeTarget.kind === "book"
                    ? removeTarget.book.title
                    : removeTarget.wishlist.title;
                return `"${title}" será removido desta coleção. ${removeTarget.kind === "book" ? "O livro em si não é afetado" : "O item da wishlist em si não é afetado"}.`;
              })()
        }
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="default"
        loading={isPending}
      />
    </div>
  );
}

// =====================================================================
// Stat builder per type
// =====================================================================
type Stat = {
  label: string;
  value: string;
  sub?: string;
  bar?: { percent: number; complete: boolean };
};

function buildStats(p: {
  type: "shelf" | "list" | "challenge" | "subscription" | "wishlist";
  totalItems: number;
  readBooks: number;
  acquiredCount: number;
  progressPercent: number;
  isCompleted: boolean;
  bookCount: number;
  wishlistCount: number;
  goal: number | null;
  start: string | null;
  end: string | null;
  lastActivity: string | null;
  estimatedTotal: number;
  wishlistAvg: number;
  wishlistWithPriceCount: number;
  mostExpensive: { title: string; price: number } | null;
}): Stat[] {
  const pctStr = `${Math.round(p.progressPercent)}%`;
  const progressBar = {
    percent: p.progressPercent,
    complete: p.isCompleted,
  };

  if (p.type === "wishlist") {
    const valueStr =
      p.wishlistWithPriceCount > 0 ? formatBRL(p.estimatedTotal) : "—";
    const avgStr =
      p.wishlistAvg > 0 ? `médio ${formatBRL(p.wishlistAvg)}` : undefined;
    return [
      {
        label: "Total",
        value: `${p.totalItems} ${p.totalItems === 1 ? "item" : "itens"}`,
      },
      {
        label: "Adquiridos",
        value: `${p.acquiredCount} de ${p.totalItems}`,
        bar: progressBar,
      },
      {
        label: "Valor estimado",
        value: valueStr,
        sub: avgStr,
      },
      {
        label: "Mais caro",
        value: p.mostExpensive ? formatBRL(p.mostExpensive.price) : "—",
        sub: p.mostExpensive ? p.mostExpensive.title : undefined,
      },
    ];
  }

  if (p.type === "shelf") {
    return [
      {
        label: "Total",
        value: `${p.totalItems} ${p.totalItems === 1 ? "item" : "items"}`,
      },
      { label: "Lidos", value: `${p.readBooks}` },
      { label: "Progresso", value: pctStr, bar: progressBar },
      {
        label: "Última atividade",
        value: relativeFromNow(p.lastActivity),
      },
    ];
  }
  if (p.type === "list") {
    let prazo = "Sem prazo";
    if (p.end) prazo = deadlineCopy(p.end);
    return [
      {
        label: "Total",
        value: `${p.totalItems} ${p.totalItems === 1 ? "item" : "items"}`,
      },
      { label: "Lidos", value: `${p.readBooks}` },
      { label: "Progresso", value: pctStr, bar: progressBar },
      { label: "Prazo", value: prazo },
    ];
  }
  if (p.type === "challenge") {
    const pace = derivePace(p.goal, p.start, p.end, p.readBooks);
    return [
      {
        label: "Meta",
        value: p.goal ? `${p.goal} livros` : "—",
      },
      { label: "Lidos", value: `${p.readBooks}` },
      { label: "Progresso", value: pctStr, bar: progressBar },
      {
        label: "Ritmo",
        value: pace ? pace.charAt(0).toUpperCase() + pace.slice(1) : "—",
        sub: pace
          ? `vs. tempo decorrido`
          : "Faltam datas pra calcular",
      },
    ];
  }
  // subscription
  const months = p.start ? monthsBetween(p.start, new Date()) : 0;
  return [
    {
      label: "Recebidos",
      value: `${p.totalItems}`,
    },
    { label: "Lidos", value: `${p.readBooks}` },
    { label: "Progresso", value: pctStr, bar: progressBar },
    {
      label: "Tempo de assinatura",
      value: p.start ? `desde ${formatMonthYear(p.start)}` : "—",
      sub:
        months > 0
          ? `${months} ${months === 1 ? "mês" : "meses"}`
          : undefined,
    },
  ];
}

// =====================================================================
// Item Card (book or wishlist)
// =====================================================================
function ItemCard({
  item,
  onRemove,
  showMarkPurchased,
}: {
  item: CollectionItem;
  onRemove: () => void;
  /** Quando true (coleção tipo wishlist), mostra link "Marcar como adquirido" em cards de wishlist. */
  showMarkPurchased?: boolean;
}) {
  if (item.kind === "book") {
    const status = (item.book.derived_status as LegacyReadingStatus) ?? "tbr";
    return (
      <div className="relative group">
        <Link
          href={`/book/${item.book.slug}`}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded-md"
        >
          <div className="rounded-md p-1.5 -m-1.5 border border-transparent hover:border-gold transition-colors">
            <div
              className="relative w-full overflow-hidden rounded-md border border-ink-deep/20 bg-paper"
              style={{ aspectRatio: "2 / 3" }}
            >
              {/* Wrapper que esmaece capa + conteúdo de items adquiridos via
                  wishlist. Hover restaura opacidade pra não atrapalhar leitura
                  do título e clique. Badge "Comprado" fica fora do wrapper
                  pra manter legibilidade. */}
              <div
                className={clsx(
                  "absolute inset-0 transition-opacity",
                  item.was_wishlist
                    ? "opacity-60 group-hover:opacity-100"
                    : "",
                )}
              >
                {item.book.cover ? (
                  <Image
                    src={imagesUrl(item.book.cover)}
                    alt={`Capa de ${item.book.title}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 200px"
                  />
                ) : (
                  <BookCoverFallback
                    title={item.book.title}
                    size="md"
                    className="w-full h-full"
                  />
                )}
              </div>
              {item.was_wishlist && (
                <span className="absolute top-1.5 right-1.5 rounded-full bg-terracota/90 text-ivory-light px-2 py-0.5 text-[10px] uppercase tracking-wider font-body shadow-sm">
                  Comprado
                </span>
              )}
            </div>
            <div
              className={clsx(
                "mt-2 transition-opacity",
                item.was_wishlist ? "opacity-60 group-hover:opacity-100" : "",
              )}
            >
              <h3 className="font-display text-sm font-medium text-ink-deep leading-snug line-clamp-2">
                {item.book.title}
              </h3>
              {item.book.authors[0] && (
                <p className="text-xs italic text-ink-fade truncate mt-0.5">
                  {item.book.authors[0]}
                  {item.book.authors.length > 1
                    ? ` +${item.book.authors.length - 1}`
                    : ""}
                </p>
              )}
              <div className="mt-1.5">
                <StatusBadge kind="reading" status={status} size="sm" />
              </div>
            </div>
          </div>
        </Link>
        <HoverActionStack>
          <RemoveAction onClick={onRemove} title={item.book.title} />
        </HoverActionStack>
      </div>
    );
  }
  // wishlist
  const w = item.wishlist;
  const priorityVariant: "burgundy" | "gold" | "fade" =
    w.priority === "high"
      ? "burgundy"
      : w.priority === "medium"
        ? "gold"
        : "fade";
  const priorityLabel =
    w.priority === "high"
      ? "alta"
      : w.priority === "medium"
        ? "média"
        : w.priority === "low"
          ? "baixa"
          : null;
  // Botão "Marcar como adquirido" só pra wishlist items pendentes em
  // coleção tipo wishlist. was_wishlist=true significa que o item já virou
  // book — mas, como item.kind aqui é "wishlist", ainda não migrou; a guarda
  // serve pra robustez caso a invariante mude.
  const canMarkPurchased = showMarkPurchased && !item.was_wishlist;
  return (
    <div className="relative group">
      <Link
        href={`/wishlist/${w.slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded-md"
      >
        <div className="rounded-md p-1.5 -m-1.5 border border-transparent hover:border-gold transition-colors">
          <div
            className="relative w-full overflow-hidden rounded-md border-l-2 border-l-terracota border-r border-y border-ink-deep/15 bg-terracota/[0.08]"
            style={{ aspectRatio: "2 / 3" }}
          >
            <BookCoverFallback
              title={w.title}
              size="md"
              className="w-full h-full"
            />
          </div>
          <div className="mt-2">
            <h3 className="font-display text-sm font-medium text-ink-deep leading-snug line-clamp-2">
              {w.title}
            </h3>
            {w.author_name && (
              <p className="text-xs italic text-ink-fade truncate mt-0.5">
                {w.author_name}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {w.estimated_price !== null && (
                <span className="text-sm font-medium text-ink-deep">
                  {formatBRL(w.estimated_price)}
                </span>
              )}
              {priorityLabel && (
                <Badge variant={priorityVariant} size="sm">
                  {priorityLabel}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Link>
      <HoverActionStack>
        <RemoveAction onClick={onRemove} title={w.title} />
        {canMarkPurchased && <MarkPurchasedAction wishlistId={w.id} />}
      </HoverActionStack>
    </div>
  );
}

function HoverActionStack({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
      {children}
    </div>
  );
}

function RemoveAction({
  onClick,
  title,
}: {
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      aria-label={`Remover ${title} da coleção`}
      title="Remover da coleção"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="rounded-md bg-ivory-light/95 backdrop-blur-sm border border-border p-1 text-ink-soft hover:text-burgundy hover:bg-burgundy/10 transition-colors"
    >
      <XMarkIcon className="w-4 h-4" />
    </button>
  );
}

function MarkPurchasedAction({ wishlistId }: { wishlistId: string }) {
  return (
    <Link
      href={`/book/new?from_wishlist=${wishlistId}`}
      aria-label="Marcar como adquirido"
      title="Marcar como adquirido"
      onClick={(e) => e.stopPropagation()}
      className="rounded-md bg-ivory-light/95 backdrop-blur-sm border border-border p-1 text-moss hover:text-moss-soft hover:bg-moss/10 transition-colors"
    >
      <CheckIcon className="w-4 h-4" />
    </Link>
  );
}
