"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChatBubbleLeftIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { HomeCard } from "./HomeCard";
import { QuillAndInk } from "@/components/decorations/QuillAndInk";
import type { QuoteForCarousel } from "@/services/homeData";

const AUTOPLAY_MS = 8000;
const FADE_MS = 400;

const QUOTE_GRADIENT =
  "linear-gradient(135deg, var(--color-paper-soft) 0%, rgba(240, 192, 64, 0.10) 100%)";

type Props = {
  quotes: QuoteForCarousel[];
};

export function DailyQuote({ quotes }: Props) {
  // Sem citações: a section inteira somem (composição em page.tsx confere
  // antes de renderizar; este return null é só safety).
  if (quotes.length === 0) return null;
  return <DailyQuoteInner quotes={quotes} />;
}

function DailyQuoteInner({ quotes }: { quotes: QuoteForCarousel[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const lastSwitchRef = useRef<number>(Date.now());

  const goToNext = useCallback(() => {
    setIsFading(true);
    window.setTimeout(() => {
      setCurrentIdx((prev) => (prev + 1) % quotes.length);
      setIsFading(false);
      lastSwitchRef.current = Date.now();
    }, FADE_MS);
  }, [quotes.length]);

  // Tick de 1s (mesmo padrão do AuthorQuoteCarousel). Não auto-troca quando
  // só há 1 quote.
  useEffect(() => {
    if (quotes.length <= 1) return;
    const id = window.setInterval(() => {
      if (Date.now() - lastSwitchRef.current >= AUTOPLAY_MS) {
        goToNext();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [quotes.length, goToNext]);

  const current = quotes[currentIdx];

  return (
    <HomeCard
      title="Citação"
      icon={<ChatBubbleLeftIcon className="w-3.5 h-3.5" />}
      surfaceClassName="border border-gold/30"
      style={{ background: QUOTE_GRADIENT }}
      className="relative overflow-hidden"
    >
      <QuillAndInk
        size="sm"
        className="absolute -top-1 right-3"
        style={{ opacity: 0.55 }}
      />

      <div
        className="transition-opacity ease-out"
        style={{
          opacity: isFading ? 0 : 1,
          transitionDuration: `${FADE_MS}ms`,
        }}
      >
        <blockquote className="font-display italic text-[15px] leading-relaxed text-ink-deep line-clamp-5">
          {current.text}
        </blockquote>
        <p className="text-[11px] italic text-ink-fade mt-3">
          — {current.author_name ?? "Autor desconhecido"}
          {current.book_title && current.book_slug && (
            <>
              {" em "}
              <Link
                href={`/book/${current.book_slug}`}
                className="not-italic underline hover:text-ink-deep transition-colors"
              >
                {current.book_title}
              </Link>
            </>
          )}
        </p>
      </div>

      {quotes.length > 1 && (
        <button
          type="button"
          onClick={goToNext}
          className="mt-3 inline-flex items-center gap-1 text-[10px] text-ink-fade hover:text-gold-deep transition-colors"
          aria-label="Trocar citação"
        >
          <ArrowPathIcon className="w-3 h-3" />
          trocar
        </button>
      )}
    </HomeCard>
  );
}

