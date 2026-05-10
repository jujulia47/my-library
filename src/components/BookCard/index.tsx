"use client";

import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PencilSquareIcon,
  TrashIcon,
  HeartIcon as HeartOutlineIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { imagesUrl } from "@/services/images";
import {
  StatusBadge,
  BookCoverFallback,
  ConfirmDialog,
  Badge,
} from "@/components/ui";
import type { LegacyReadingStatus } from "@/components/ui/StatusBadge";
import type { BookListItem } from "@/services/bookList";
import { deleteBook } from "@/actions/deleteBook";
import { toggleBookFavorite } from "@/actions/toggleBookFavorite";

type Props = {
  book: BookListItem;
};

export default function BookCard({ book }: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const status =
    (book.latest_reading?.status as LegacyReadingStatus | null) ?? "tbr";
  // Sessão 17.2: o que era `disposed` virou 4 estados (donated/sold/traded/
  // lost) — todos significam "saiu do acervo". Mostra o card esmaecido e
  // badge correspondente; pra `returned` (livro emprestado que voltou)
  // também usamos esmaecido pq não está mais conosco.
  const disposedStates = ["donated", "sold", "traded", "lost", "returned"] as const;
  const isDisposed = (disposedStates as readonly string[]).includes(
    book.ownership_status,
  );
  const disposedLabelMap: Record<string, string> = {
    donated: "Doei",
    sold: "Vendi",
    traded: "Troquei",
    lost: "Perdi",
    returned: "Devolvi",
  };
  const disposedLabel = disposedLabelMap[book.ownership_status];
  const author = book.authors[0] ?? null;
  const moreAuthors = book.authors.length > 1 ? book.authors.length - 1 : 0;

  const [error, setError] = useState<string | null>(null);
  // Estado otimista do coração — mesmo pattern do CollectionCard star.
  const [favorite, setFavorite] = useState(book.is_favorite);
  const [favPending, setFavPending] = useState(false);

  const handleFavoriteToggle = async () => {
    const previous = favorite;
    setFavorite(!previous);
    setFavPending(true);
    const result = await toggleBookFavorite(book.id);
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
      const result = await deleteBook(book.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    });
  };

  // Sessão 17.3: border-l-3 colorida pelo status da reading mais recente.
  // Vai na lateral esquerda do card (bg ivory-light pra realçar a barra).
  const statusBorderClass =
    status === "reading"
      ? "border-l-gold"
      : status === "finished"
        ? "border-l-moss"
        : status === "paused"
          ? "border-l-ink-fade"
          : status === "abandoned"
            ? "border-l-burgundy"
            : "border-l-cappuccino";

  return (
    <>
      <div
        className={clsx(
          "relative group rounded-lg p-2 -m-2",
          "border border-transparent border-l-[3px] bg-ivory-light",
          statusBorderClass,
          "transition-colors duration-150",
          "hover:border-gold",
        )}
      >
        <Link
          href={`/book/${book.slug}`}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded-md"
        >
          {/* Wrapper que esmaece SÓ a imagem da capa quando o livro está doado.
              Badge "Doado", título, autor e status ficam fora deste div pra
              manter opacidade total. */}
          <div
            className={clsx(
              "relative w-full overflow-hidden rounded-md border border-ink-deep/20 bg-paper",
              isDisposed && "opacity-60",
            )}
            style={{ aspectRatio: "2 / 3" }}
          >
            {book.cover ? (
              <Image
                src={imagesUrl(book.cover)}
                alt={`Capa do livro ${book.title}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
              />
            ) : (
              <BookCoverFallback
                title={book.title}
                size="lg"
                className="w-full h-full"
              />
            )}
          </div>

          <div className="mt-2">
            <h3 className="font-display text-base font-medium text-ink-deep leading-snug line-clamp-2">
              {book.title}
            </h3>
            {author && (
              <p className="font-body text-[13px] italic text-ink-fade truncate mt-0.5">
                {author}
                {moreAuthors > 0 && ` +${moreAuthors}`}
              </p>
            )}
            <div className="mt-2">
              <StatusBadge kind="reading" status={status} size="sm" />
            </div>
          </div>
        </Link>

        {/* Badge de estado terminal (saiu do acervo) — fica FORA do wrapper
            esmaecido pra ficar legível. */}
        {isDisposed && disposedLabel && (
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <Badge variant="fade" size="sm" className="shadow-sm">
              {disposedLabel}
            </Badge>
          </div>
        )}

        {/* Coração de favorito: sempre visível quando favorito; só hover quando
            não. Burgundy filled pra não conflitar com o gold do rating em
            estrelas (decisão de design da sessão 15.1). */}
        <button
          type="button"
          aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          title={favorite ? "Favorito" : "Marcar como favorito"}
          aria-pressed={favorite}
          disabled={favPending}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFavoriteToggle();
          }}
          className={clsx(
            "absolute top-4 right-4 z-10 p-1.5 rounded-md transition-all",
            "bg-ivory-light/95 backdrop-blur-sm border border-border",
            favorite
              ? "text-burgundy hover:bg-burgundy/10"
              : "text-ink-fade/60 opacity-0 group-hover:opacity-100 hover:text-ink-soft",
            favPending && "opacity-60 cursor-wait",
          )}
        >
          {favorite ? (
            <HeartSolidIcon className="w-4 h-4" />
          ) : (
            <HeartOutlineIcon className="w-4 h-4" />
          )}
        </button>

        {/* Hover actions (edit/delete) — deslocados pra esquerda pra não
            colidir com o coração. */}
        <div
          className={clsx(
            "absolute top-4 right-14 flex items-center gap-1 z-10",
            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
            "transition-opacity duration-150",
          )}
        >
          <Link
            href={`/book/edit/${book.id}?from=/book`}
            aria-label={`Editar ${book.title}`}
            className="rounded-md bg-ivory-light/95 backdrop-blur-sm border border-border p-1.5 text-ink-soft hover:text-ink-deep hover:bg-ivory-light transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <PencilSquareIcon className="w-4 h-4" />
          </Link>
          <button
            type="button"
            aria-label={`Excluir ${book.title}`}
            className="rounded-md bg-ivory-light/95 backdrop-blur-sm border border-border p-1.5 text-burgundy hover:bg-burgundy/10 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setConfirmOpen(true);
            }}
          >
            <TrashIcon className="w-4 h-4" />
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
        title="Excluir livro?"
        description={
          error
            ? error
            : `"${book.title}" será removido. Todas as leituras, citações e relações associadas também serão removidas. Esta ação não pode ser desfeita.`
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={isPending}
      />
    </>
  );
}
