"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  Badge,
  Button,
  BackButton,
  ConfirmDialog,
} from "@/components/ui";
import { deleteWishlist } from "@/actions/deleteWishlist";
import {
  EllipsisVerticalIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import type { Database } from "@/utils/typings/supabase";

type WishlistPriority = Database["public"]["Enums"]["wishlist_priority"];

export type WishlistDetail = {
  id: string;
  slug: string;
  title: string;
  author_name: string | null;
  purchase_link: string | null;
  estimated_price: number | null;
  priority: WishlistPriority | null;
  notes: string | null;
  collections: { id: string; name: string; slug: string }[];
};

const priorityBadge: Record<
  WishlistPriority,
  { variant: "burgundy" | "gold" | "fade"; label: string }
> = {
  high: { variant: "burgundy", label: "Alta" },
  medium: { variant: "gold", label: "Média" },
  low: { variant: "fade", label: "Baixa" },
};

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function shortDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export default function WishlistDetailClient({
  item,
}: {
  item: WishlistDetail;
}) {
  const router = useRouter();
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteWishlist(item.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push("/wishlist");
      router.refresh();
    });
  };

  const handleMarkAcquired = () => {
    // Vai pro form de criar livro com a wishlist item como origem.
    // O createBookMinimal lê `from_wishlist` e deleta o item após criar.
    router.push(`/book/new?from_wishlist=${item.id}`);
  };

  const priceFormatted =
    item.estimated_price !== null
      ? formatBRL(Number(item.estimated_price))
      : null;
  const domain = shortDomain(item.purchase_link);

  return (
    <div className="font-body max-w-3xl mx-auto">
      <div className="mb-4">
        <BackButton fallback="/wishlist" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-3xl md:text-4xl font-medium text-ink-deep">
            {item.title}
          </h1>
          {item.author_name && (
            <p className="text-ink-soft italic mt-1">{item.author_name}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {item.priority && (
              <Badge
                variant={priorityBadge[item.priority].variant}
                size="sm"
              >
                Prioridade {priorityBadge[item.priority].label.toLowerCase()}
              </Badge>
            )}
            {priceFormatted && (
              <Badge variant="navy" size="sm">
                {priceFormatted}
              </Badge>
            )}
          </div>
          {item.collections.length > 0 && (
            <p className="text-xs italic text-ink-fade mt-2">
              {item.collections.length === 1 ? "Em coleção: " : `Em ${item.collections.length} coleções: `}
              {item.collections.map((col, idx) => (
                <span key={col.id}>
                  <Link
                    href={`/collection/${col.slug}`}
                    className="text-ink-soft underline hover:text-ink-deep transition-colors not-italic"
                  >
                    {col.name}
                  </Link>
                  {idx < item.collections.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            type="button"
            variant="accent-moss"
            size="sm"
            leftIcon={<CheckCircleIcon className="w-4 h-4" />}
            onClick={handleMarkAcquired}
          >
            Marcar como adquirido
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
                <a
                  href={`/wishlist/edit/${item.id}?from=/wishlist/${item.slug}`}
                  onMouseDown={(e) => e.preventDefault()}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-deep hover:bg-paper-soft transition-colors"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                  Editar
                </a>
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
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {(item.purchase_link || priceFormatted || item.notes) && (
        <Card>
          <dl className="space-y-4">
            {item.purchase_link && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ink-fade mb-1">
                  Link
                </dt>
                <dd>
                  <a
                    href={item.purchase_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-gold-deep hover:text-ink-deep transition-colors"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    <span>{domain ?? item.purchase_link}</span>
                  </a>
                </dd>
              </div>
            )}
            {priceFormatted && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ink-fade mb-1">
                  Preço estimado
                </dt>
                <dd className="text-ink-deep">{priceFormatted}</dd>
              </div>
            )}
            {item.notes && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ink-fade mb-1">
                  Observação
                </dt>
                <dd className="text-ink-deep italic whitespace-pre-wrap">
                  {item.notes}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setError(null);
        }}
        onConfirm={handleDelete}
        title="Excluir item da wishlist?"
        description={
          error
            ? error
            : `"${item.title}" será removido da wishlist. Esta ação não pode ser desfeita.`
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={isPending}
      />
    </div>
  );
}
