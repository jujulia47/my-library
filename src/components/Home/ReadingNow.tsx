"use client";

import { useState } from "react";
import Link from "next/link";
import { BookmarkIcon } from "@heroicons/react/24/solid";
import { BookCoverFallback } from "@/components/ui";
import UpdateProgressModal, {
  type UpdateProgressTarget,
} from "@/components/forms/UpdateProgressModal";
import type { ReadingNowItem } from "@/services/homeData";

type Props = {
  items: ReadingNowItem[];
};

export function ReadingNow({ items }: Props) {
  const [target, setTarget] = useState<UpdateProgressTarget | null>(null);
  const [open, setOpen] = useState(false);

  const handleOpen = (item: ReadingNowItem) => {
    setTarget({
      reading_id: item.reading_id,
      book_slug: item.slug,
      book_title: item.title,
      current_page: item.current_page,
      pages_count: item.pages_count,
    });
    setOpen(true);
  };

  if (items.length === 0) {
    return (
      <div className="bg-paper border border-paper-soft rounded-lg p-6 text-center">
        <p className="font-body text-sm text-ink-soft">
          Você não está lendo nada agora.
        </p>
        <Link
          href="/book"
          className="inline-block mt-2 text-xs text-gold-deep hover:text-ink-deep transition-colors"
        >
          Comece um livro →
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {items.map((item) => (
          <ReadingNowCard
            key={item.reading_id}
            item={item}
            onUpdate={() => handleOpen(item)}
          />
        ))}
      </div>

      <UpdateProgressModal
        open={open}
        onClose={() => setOpen(false)}
        target={target}
      />
    </>
  );
}

function ReadingNowCard({
  item,
  onUpdate,
}: {
  item: ReadingNowItem;
  onUpdate: () => void;
}) {
  return (
    <div className="flex gap-2.5 p-2.5 bg-paper border border-paper-soft rounded-lg hover:border-gold transition-colors duration-150">
      <Link
        href={`/book/${item.slug}`}
        className="flex-shrink-0 w-11 relative"
        style={{ aspectRatio: "2 / 3" }}
        aria-label={`Abrir ${item.title}`}
      >
        <BookCoverFallback
          title={item.title}
          size="sm"
          className="w-full h-full"
        />
      </Link>

      <div className="flex-1 min-w-0 flex flex-col">
        <Link
          href={`/book/${item.slug}`}
          className="font-display text-sm font-medium text-ink-deep leading-tight hover:text-gold-deep transition-colors line-clamp-2"
        >
          {item.title}
        </Link>
        {item.author_name && (
          <p className="font-body text-xs italic text-ink-fade truncate">
            {item.author_name}
          </p>
        )}

        <div className="mt-auto pt-1.5">
          <div className="h-[3px] w-full bg-paper-soft rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-300"
              style={{ width: `${item.progress_percent}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1 gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] text-ink-fade font-body">
              <BookmarkIcon
                className="w-3 h-3 text-gold-deep/70"
                aria-hidden
              />
              {item.current_page}/{item.pages_count} · {item.progress_percent}%
            </span>
            <button
              type="button"
              onClick={onUpdate}
              className="text-[10px] font-body text-gold-deep hover:text-ink-deep transition-colors underline-offset-2 hover:underline"
            >
              Atualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
