"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookmarkIcon } from "@heroicons/react/24/solid";
import { Button, BookCoverFallback } from "@/components/ui";
import { updateReadingProgress } from "@/actions/updateReadingProgress";
import { playPageTurn } from "@/utils/sounds";
import type { TodayActiveReading } from "@/services/todayData";

type Props = {
  readings: TodayActiveReading[];
};

/**
 * Input rápido pra "anotar o dia": escolhe uma leitura ativa, marca página
 * nova e anota um trecho/sensação. Reutiliza a action `updateReadingProgress`
 * — log_date é deixado em branco pra cair no default de hoje.
 */
export function TodayLogForm({ readings }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(
    readings[0]?.reading_id ?? null,
  );
  const [page, setPage] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const selected = readings.find((r) => r.reading_id === selectedId) ?? null;

  // Toda vez que troca de livro selecionado, ressincroniza a página atual
  // pra default no input — evita persistir valor do livro anterior.
  useEffect(() => {
    if (selected) setPage(String(selected.current_page));
    setSuccess(false);
    setError(null);
    setFieldError(null);
  }, [selected?.reading_id, selected?.current_page, selected]);

  if (readings.length === 0) {
    return (
      <div className="bg-paper border border-paper-soft rounded-lg p-6 text-center">
        <p className="font-display italic text-ink-soft">
          Você não está lendo nada agora — comece um livro pra anotar o dia.
        </p>
      </div>
    );
  }

  const numericPage = Number(page);
  const percent =
    selected?.pages_total && Number.isFinite(numericPage)
      ? Math.min(
          100,
          Math.max(0, Math.round((numericPage / selected.pages_total) * 100)),
        )
      : null;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selected) return;
    const fd = new FormData(e.currentTarget);
    setError(null);
    setFieldError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateReadingProgress(fd);
      if (!result.ok) {
        if (result.field === "current_page") {
          setFieldError(result.message);
        } else {
          setError(result.message);
        }
        return;
      }
      setSuccess(true);
      setNote("");
      playPageTurn();
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="bg-paper border border-paper-soft rounded-lg p-5 space-y-4"
    >
      {/* Seletor de leitura quando há mais de uma ativa — chips com capa. */}
      {readings.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {readings.map((r) => {
            const active = r.reading_id === selectedId;
            return (
              <button
                key={r.reading_id}
                type="button"
                onClick={() => setSelectedId(r.reading_id)}
                className={`flex items-center gap-2 rounded-md border pl-1.5 pr-3 py-1 text-xs transition-colors ${
                  active
                    ? "border-[#6D3914] bg-[#6D3914]/12 text-[#6D3914]"
                    : "border-border bg-ivory-light text-ink-soft hover:bg-paper-soft"
                }`}
              >
                <span
                  className="w-5 h-7 relative rounded-sm overflow-hidden border border-ink-deep/15 flex-shrink-0"
                  style={{ aspectRatio: "2 / 3" }}
                >
                  {r.cover_url ? (
                    <Image
                      src={r.cover_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="20px"
                    />
                  ) : (
                    <BookCoverFallback
                      title={r.title}
                      size="sm"
                      className="w-full h-full"
                    />
                  )}
                </span>
                <span className="font-body line-clamp-1 max-w-[12rem]">
                  {r.title}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <input type="hidden" name="id" value={selected.reading_id} />
      )}
      {selected && (
        <input type="hidden" name="book_slug" value={selected.book_slug} />
      )}

      {/* Bloco do livro selecionado — capa + título + autor + página atual */}
      {selected && (
        <div className="flex gap-3 items-center">
          <div
            className="w-12 flex-shrink-0 relative rounded-sm overflow-hidden border border-ink-deep/15"
            style={{ aspectRatio: "2 / 3" }}
          >
            {selected.cover_url ? (
              <Image
                src={selected.cover_url}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <BookCoverFallback
                title={selected.title}
                size="sm"
                className="w-full h-full"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-base text-ink-deep leading-tight line-clamp-1">
              {selected.title}
            </p>
            {selected.author_name && (
              <p className="font-body text-xs italic text-ink-fade truncate">
                {selected.author_name}
              </p>
            )}
            <p className="text-[11px] text-ink-fade font-body mt-0.5 inline-flex items-center gap-1">
              <BookmarkIcon
                className="w-3 h-3 text-[#6D3914]/80"
                aria-hidden
              />
              página {selected.current_page}
              {selected.pages_total && (
                <span>
                  {" "}
                  / {selected.pages_total}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <label
            htmlFor="today-page"
            className="block text-sm font-body font-medium text-ink-deep mb-1"
          >
            Onde você parou
          </label>
          <input
            id="today-page"
            type="number"
            name="current_page"
            min={0}
            max={selected?.pages_total ?? undefined}
            value={page}
            onChange={(e) => setPage(e.target.value)}
            className="w-full rounded-md border border-border bg-ivory-light px-3 py-2 text-sm focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none"
          />
          {fieldError && (
            <p className="text-xs text-burgundy mt-1">{fieldError}</p>
          )}
        </div>
        {percent !== null && (
          <p className="font-body text-xs italic text-ink-fade pb-3">
            {percent}%
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="today-note"
          className="block font-display italic text-base text-ink-deep mb-1"
        >
          O que ficou de hoje?
        </label>
        <textarea
          id="today-note"
          name="notes"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Trecho marcante, sensação, onde você estava…"
          className="w-full bg-ivory-light text-ink-deep placeholder:text-ink-fade/70 text-sm font-body leading-relaxed border border-border focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none rounded-md px-3 py-2 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm italic text-moss bg-moss/10 border border-moss/30 rounded-md px-3 py-2">
          ✓ Anotação salva no diário de hoje.
        </p>
      )}

      <div className="flex justify-end pt-2 border-t border-border">
        <Button type="submit" variant="primary" size="sm" loading={isPending}>
          Salvar no diário
        </Button>
      </div>
    </form>
  );
}
