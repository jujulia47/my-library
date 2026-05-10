"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { QuillAndInk } from "@/components/decorations/QuillAndInk";

const AUTOPLAY_MS = 6000;
const MANUAL_PAUSE_MS = 10000;

type CarouselQuote = {
  id: string;
  slug: string;
  text: string;
  created_at: string;
  book: { id: string; slug: string; title: string } | null;
};

export type AuthorQuoteCarouselProps = {
  quotes: CarouselQuote[];
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function AuthorQuoteCarousel({
  quotes,
}: AuthorQuoteCarouselProps) {
  // Mostra no máximo 3 mais recentes; service já entrega ordenado por created_at desc
  const visible = quotes.slice(0, 3);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const manualPauseUntilRef = useRef<number>(0);

  // Tick de 1s checa se passaram AUTOPLAY_MS desde a última troca; pausa
  // quando hovered ou em pausa manual (dentro de MANUAL_PAUSE_MS após click).
  const lastSwitchRef = useRef<number>(Date.now());
  useEffect(() => {
    if (visible.length <= 1) return;
    const id = window.setInterval(() => {
      if (hovered) return;
      if (Date.now() < manualPauseUntilRef.current) return;
      if (Date.now() - lastSwitchRef.current >= AUTOPLAY_MS) {
        setIndex((i) => (i + 1) % visible.length);
        lastSwitchRef.current = Date.now();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [hovered, visible.length]);

  const goPrev = () => {
    manualPauseUntilRef.current = Date.now() + MANUAL_PAUSE_MS;
    lastSwitchRef.current = Date.now();
    setIndex((i) => (i - 1 + visible.length) % visible.length);
  };
  const goNext = () => {
    manualPauseUntilRef.current = Date.now() + MANUAL_PAUSE_MS;
    lastSwitchRef.current = Date.now();
    setIndex((i) => (i + 1) % visible.length);
  };
  const goTo = (i: number) => {
    manualPauseUntilRef.current = Date.now() + MANUAL_PAUSE_MS;
    lastSwitchRef.current = Date.now();
    setIndex(i);
  };

  if (visible.length === 0) return null;

  return (
    <section
      className="my-8"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Citações marcantes"
    >
      <div className="flex items-stretch gap-3">
        {visible.length > 1 && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Citação anterior"
            className="flex-shrink-0 self-center p-2 rounded-md border border-border bg-ivory-light text-ink-soft hover:text-ink-deep hover:bg-paper-soft transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
        )}
        <div
          className="flex-1 relative rounded-lg border border-gold/30 p-6 min-h-[160px] overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, var(--color-paper-soft) 0%, rgba(240, 192, 64, 0.12) 100%)",
          }}
        >
          <QuillAndInk
            size="md"
            className="absolute right-3 top-3"
            style={{ opacity: 0.55 }}
          />
          {visible.map((q, i) => {
            const active = i === index;
            return (
              <div
                key={q.id}
                aria-hidden={!active}
                className={clsx(
                  "absolute inset-0 p-6 transition-opacity duration-500 ease-out flex flex-col justify-between",
                  active ? "opacity-100" : "opacity-0 pointer-events-none",
                )}
              >
                <Link
                  href={`/quote/${q.slug}`}
                  className="block hover:opacity-90 transition-opacity"
                >
                  <blockquote className="font-display italic text-[15px] leading-relaxed text-ink-deep line-clamp-5">
                    {q.text}
                  </blockquote>
                </Link>
                <p className="mt-3 text-[11px] italic text-ink-fade">
                  {q.book ? (
                    <>
                      <Link
                        href={`/book/${q.book.slug}`}
                        className="not-italic underline hover:text-ink-deep"
                      >
                        {q.book.title}
                      </Link>
                      {" · "}
                    </>
                  ) : null}
                  {formatDate(q.created_at)}
                </p>
              </div>
            );
          })}
          {/* Reserva altura igual ao maior conteúdo (uses aria-hidden invisible
              text). */}
          <div className="invisible">
            <blockquote className="font-display italic text-[15px] leading-relaxed line-clamp-5">
              {visible[0]?.text}
            </blockquote>
            <p className="mt-3 text-[11px]">&nbsp;</p>
          </div>
        </div>
        {visible.length > 1 && (
          <button
            type="button"
            onClick={goNext}
            aria-label="Próxima citação"
            className="flex-shrink-0 self-center p-2 rounded-md border border-border bg-ivory-light text-ink-soft hover:text-ink-deep hover:bg-paper-soft transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      {visible.length > 1 && (
        <div className="flex justify-end gap-1.5 mt-3 pr-12">
          {visible.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir pra citação ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className={clsx(
                "w-2 h-2 rounded-full transition-colors",
                i === index ? "bg-gold" : "bg-ink-fade/30 hover:bg-ink-fade/60",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
