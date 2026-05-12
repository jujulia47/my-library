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
  /** Marca a imagem como prioritária (LCP). Use nas primeiras N posições da
   *  grid pra acelerar o paint da primeira tela. */
  priority?: boolean;
};

export default function BookCard({ book, priority = false }: Props) {
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
  // Hover do coração — controlado via state pra fazer swap outline → solid
  // confiável (CSS-only com `group-hover/btn:hidden` estava sendo silencioso
  // em algumas combinações do Tailwind v4).
  const [heartHover, setHeartHover] = useState(false);

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

  return (
    <>
      <div
        className={clsx(
          "book-card-hover",
          "relative group rounded-lg p-2 -m-2",
          "border border-transparent bg-ivory-light",
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
                quality={70}
                priority={priority}
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

        {/* Ações do card: Editar, Excluir, Favoritar — todos no mesmo
            container pra ter espaçamento uniforme. Editar e Excluir só
            aparecem no hover do card; Favoritar fica sempre visível quando
            já está marcado. Cada botão usa `book-card-icon-btn` (CSS em
            globals.css) que escala SÓ o SVG interno no hover, não o
            quadrado. */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
          <Link
            href={`/book/edit/${book.id}?from=/book`}
            aria-label={`Editar ${book.title}`}
            onClick={(e) => e.stopPropagation()}
            className={clsx(
              "book-card-icon-btn cursor-pointer rounded-md bg-ivory-light/95 backdrop-blur-sm border border-border p-1.5 text-ink-soft",
              "hover:text-ink-deep",
              "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150",
            )}
          >
            <PencilSquareIcon className="w-4 h-4" />
          </Link>
          <button
            type="button"
            aria-label={`Excluir ${book.title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setConfirmOpen(true);
            }}
            className={clsx(
              "book-card-icon-btn cursor-pointer rounded-md bg-ivory-light/95 backdrop-blur-sm border border-border p-1.5 text-burgundy",
              "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150",
            )}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label={
              favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
            }
            title={favorite ? "Favorito" : "Marcar como favorito"}
            aria-pressed={favorite}
            disabled={favPending}
            onMouseEnter={() => setHeartHover(true)}
            onMouseLeave={() => setHeartHover(false)}
            onFocus={() => setHeartHover(true)}
            onBlur={() => setHeartHover(false)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFavoriteToggle();
            }}
            className={clsx(
              "book-card-icon-btn cursor-pointer rounded-md p-1.5",
              "bg-ivory-light/95 backdrop-blur-sm border border-border",
              favorite || heartHover
                ? "text-burgundy"
                : "text-ink-fade/60",
              !favorite &&
                "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
              favPending && "opacity-60 cursor-wait",
            )}
          >
            {favorite || heartHover ? (
              <HeartSolidIcon className="w-4 h-4" />
            ) : (
              <HeartOutlineIcon className="w-4 h-4" />
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
