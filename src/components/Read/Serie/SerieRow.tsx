"use client";

import Link from "next/link";
import clsx from "clsx";
import { Card, StatusBadge } from "@/components/ui";
import SerieCarousel from "./SerieCarousel";
import type { SerieListItem } from "@/services/serieList";
import { deriveCurrentVolume } from "@/services/serieDerivedFields";
import { deriveSerieDates, resolveSerieDates } from "@/services/serieDates";
import { lastActivityVerb } from "@/services/serieLastActivity";
import { formatDuration, formatDurationLabel } from "@/utils/formatDuration";

type Props = {
  serie: SerieListItem;
};

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

function progressBarColor(serie: SerieListItem): string {
  if (serie.status === "finished") return "bg-moss";
  if (serie.status === "abandoned") return "bg-burgundy";
  if (serie.status === "paused") return "bg-olive";
  if (serie.status === "reading") return "bg-gold";
  return "bg-ink-fade/40";
}

function finishedYear(serie: SerieListItem): string | null {
  let max: string | null = null;
  for (const b of serie.books) {
    for (const r of b.readings) {
      if (r.status === "finished" && r.finish_date) {
        if (!max || r.finish_date > max) max = r.finish_date;
      }
    }
  }
  if (!max) return null;
  return new Date(max).getUTCFullYear().toString();
}

/**
 * Stretched-link pattern: o `<Link>` cobre toda a Card (z-0) tornando o
 * container clicável. Elementos interativos internos (carrossel, mini-cards
 * de volume) ficam em `relative z-10` pra interceptar o click antes do link
 * do container. Evita aninhamento de `<a>` (HTML inválido).
 */
export default function SerieRow({ serie }: Props) {
  const { name, status, qty_volumes, read_count, description, slug } = serie;
  const total = qty_volumes ?? null;
  const percent =
    total != null && total > 0
      ? Math.min(100, Math.round((read_count / total) * 100))
      : 0;
  const yearFinished = status === "finished" ? finishedYear(serie) : null;

  const derived = deriveCurrentVolume(serie.books);
  const currentReadingBookId = derived.currentReading?.book.id ?? null;
  const nextToReadBookId = derived.nextToRead?.book.id ?? null;

  // Duração derivada da série. Override do usuário (`serie.start_date` /
  // `serie.finish_date`) tem precedência sobre o cálculo das readings.
  const derivedDates = deriveSerieDates(serie.books);
  const resolved = resolveSerieDates(derivedDates, {
    start_date: serie.start_date,
    finish_date: serie.finish_date,
  });
  let durationText: string | null = null;
  if (resolved.startDate) {
    if (status === "finished") {
      const dur = formatDurationLabel(resolved.startDate, resolved.finishDate);
      durationText = `durou ${dur}`;
    } else if (status === "abandoned") {
      const dur = formatDurationLabel(resolved.startDate, resolved.finishDate);
      durationText = `li por ${dur}`;
    } else if (status === "reading" || status === "paused") {
      // `formatDuration` retorna "há X dias/meses/anos". Pra "lendo há X"
      // precisamos só remover o "há" — ele será reescrito na composição.
      const raw = formatDuration(resolved.startDate, null);
      const stripped = raw === "hoje" ? "menos de 1 dia" : raw.replace(/^há /, "");
      durationText = `lendo há ${stripped}`;
    }
    // tbr: durationText = null (sem texto)
  }

  return (
    <div
      className={clsx(
        "relative group rounded-lg p-2 -m-2",
        "border border-transparent transition-colors duration-150",
        "hover:border-gold",
      )}
    >
      <Card className="relative">
        {/* Stretched link cobre o card inteiro. z-[1] fica acima do header
            (que é fluxo normal, sem z-index) e abaixo do carrossel (z-10),
            garantindo que cliques em qualquer área do header disparem
            navegação pra detail da série, sem bloquear interação com o
            carrossel. */}
        <Link
          href={`/serie/${slug}`}
          aria-label={`Ver detalhes de ${name}`}
          className="absolute inset-0 z-[1] rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
        />

        {/* Header — fluxo normal (sem z). O stretched link em z-[1] fica
            visualmente em cima e captura cliques. Conteúdo só texto/badges,
            nada interativo aqui. */}
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-medium text-ink-deep leading-tight">
                {name}
              </h2>
              <StatusBadge kind="serie" status={status} size="sm" />
            </div>

            {serie.authors.length > 0 && (
              <p className="font-body text-sm italic text-ink-fade">
                {serie.authors.join(", ")}
              </p>
            )}

            {total != null && (
              <div className="space-y-1 max-w-md">
                <div className="h-[3px] bg-paper-soft rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      "h-full transition-all",
                      progressBarColor(serie),
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-xs italic text-ink-fade">
                  {read_count} de {total} lidos
                  {durationText && ` · ${durationText}`}
                  {yearFinished && ` · concluída em ${yearFinished}`}
                </p>
              </div>
            )}
            {total == null && read_count > 0 && (
              <p className="text-xs italic text-ink-fade">
                {read_count} {read_count === 1 ? "livro lido" : "livros lidos"}
                {durationText && ` · ${durationText}`}
              </p>
            )}
            {total == null && read_count === 0 && durationText && (
              <p className="text-xs italic text-ink-fade">{durationText}</p>
            )}

            {serie.last_activity_detail && (
              <p className="text-xs italic text-ink-fade">
                {lastActivityVerb(serie.last_activity_detail)}{" "}
                <span className="not-italic">
                  {serie.last_activity_detail.book_title}
                </span>{" "}
                · {relativeFromNow(serie.last_activity_detail.date)}
              </p>
            )}
          </div>

          {description && (
            <div className="md:max-w-[240px] md:flex-shrink-0 space-y-1.5">
              <p className="text-[11px] uppercase tracking-wider text-ink-fade">
                Sobre a série
              </p>
              <p className="text-sm italic text-ink-soft line-clamp-3 leading-snug">
                {description}
              </p>
            </div>
          )}
        </div>

        {/* Carrossel — z-10 fica acima do stretched link pra que os mini-cards
            e setas/dots interceptem cliques. */}
        {(serie.books.length > 0 || (qty_volumes ?? 0) > 0) && (
          <div className="relative z-10 mt-5 pt-5 border-t border-border">
            <SerieCarousel
              books={serie.books}
              qtyVolumes={qty_volumes}
              serieId={serie.id}
              serieSlug={slug}
              currentReadingBookId={currentReadingBookId}
              nextToReadBookId={nextToReadBookId}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
