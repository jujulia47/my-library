"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  Badge,
  Button,
  BackButton,
  ConfirmDialog,
} from "@/components/ui";
import { deleteQuote } from "@/actions/deleteQuote";
import { toggleQuoteFavorite } from "@/actions/toggleQuoteFavorite";
import {
  PencilSquareIcon,
  TrashIcon,
  StarIcon as StarOutlineIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

export type QuoteDetail = {
  id: string;
  slug: string;
  text: string;
  page: number | null;
  chapter: string | null;
  author_name: string | null;
  source: string | null;
  note: string | null;
  is_favorite: boolean;
  book: {
    id: string;
    slug: string;
    title: string;
    author: string | null;
  } | null;
};

export default function QuoteDetailClient({ quote }: { quote: QuoteDetail }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [favorite, setFavorite] = useState(quote.is_favorite);
  const [favPending, setFavPending] = useState(false);

  const handleFavoriteToggle = async () => {
    const previous = favorite;
    setFavorite(!previous);
    setFavPending(true);
    const result = await toggleQuoteFavorite(quote.id);
    setFavPending(false);
    if (!result.ok) {
      setFavorite(previous);
      return;
    }
    router.refresh();
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteQuote(quote.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push("/quote");
      router.refresh();
    });
  };

  const isLinked = !!quote.book;
  const displayAuthor = quote.author_name?.trim() || quote.book?.author || null;

  return (
    <div className="font-body max-w-3xl mx-auto">
      <div className="mb-4">
        <BackButton fallback="/quote" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <Badge variant={isLinked ? "moss" : "terracota"} size="sm">
            {isLinked ? "Vinculada a livro" : "Citação avulsa"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            aria-pressed={favorite}
            disabled={favPending}
            onClick={handleFavoriteToggle}
            className={`p-2 rounded-md border border-border bg-ivory-light transition-colors ${
              favorite
                ? "text-gold hover:text-gold-deep"
                : "text-ink-soft hover:text-ink-deep hover:bg-paper"
            } ${favPending ? "opacity-60 cursor-wait" : ""}`}
          >
            {favorite ? (
              <StarSolidIcon className="w-5 h-5" />
            ) : (
              <StarOutlineIcon className="w-5 h-5" />
            )}
          </button>
          <Button
            as="Link"
            href={`/quote/edit/${quote.id}?from=/quote/${quote.slug}`}
            variant="secondary"
            size="sm"
            leftIcon={<PencilSquareIcon className="w-4 h-4" />}
          >
            Editar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            leftIcon={<TrashIcon className="w-4 h-4" />}
            onClick={() => setConfirmOpen(true)}
          >
            Excluir
          </Button>
        </div>
      </div>

      <Card>
        <blockquote className="border-l-2 border-gold pl-6 py-2">
          <p className="font-display text-2xl md:text-3xl italic text-ink-deep leading-relaxed">
            “{quote.text}”
          </p>
        </blockquote>

        <div className="mt-6 pt-4 border-t border-border space-y-1">
          {displayAuthor && (
            <p className="font-display text-lg text-ink-deep">
              {displayAuthor}
            </p>
          )}

          {isLinked && quote.book && (
            <p className="text-sm italic text-ink-fade">
              em{" "}
              <Link
                href={`/book/${quote.book.slug}`}
                className="text-gold-deep underline hover:text-ink-deep transition-colors not-italic"
              >
                {quote.book.title}
              </Link>
              {quote.chapter && <>, cap. {quote.chapter}</>}
              {quote.page && <>, p. {quote.page}</>}
            </p>
          )}

          {!isLinked && quote.source && (
            <p className="text-sm italic text-ink-fade">em {quote.source}</p>
          )}

          {!displayAuthor && !quote.source && (
            <p className="text-sm italic text-ink-fade">Sem atribuição</p>
          )}
        </div>

        {quote.note && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-[11px] uppercase tracking-wider text-ink-fade mb-2">
              Anotação pessoal
            </p>
            <p className="text-sm italic text-ink-soft border-l-2 border-border pl-4">
              {quote.note}
            </p>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setError(null);
        }}
        onConfirm={handleDelete}
        title="Excluir citação?"
        description={
          error
            ? error
            : "A citação será removida em definitivo. Esta ação não pode ser desfeita."
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={isPending}
      />
    </div>
  );
}
