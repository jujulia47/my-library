"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { imagesUrl } from "@/services/images";
import {
  Card,
  Button,
  BackButton,
  StatusBadge,
  ConfirmDialog,
} from "@/components/ui";
import LinkBookToSerieModal from "@/components/forms/LinkBookToSerieModal";
import { deleteSerie } from "@/actions/deleteSerie";
import { unlinkBookFromSerie } from "@/actions/unlinkBookFromSerie";
import { formatDate } from "@/utils/formatDate";
import { deriveCurrentVolume } from "@/services/serieDerivedFields";
import {
  type LastActivity,
  lastActivityVerb,
} from "@/services/serieLastActivity";
import {
  EllipsisVerticalIcon,
  LinkSlashIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import type { Database } from "@/utils/typings/supabase";
import type { LegacyReadingStatus } from "@/components/ui/StatusBadge";

type SerieRow = Database["public"]["Tables"]["serie"]["Row"];
type ReadingStatus = Database["public"]["Enums"]["reading_status"];

export type SerieVolumeReading = {
  status: ReadingStatus;
  start_date: string | null;
  finish_date: string | null;
  current_page: number | null;
  rating: number | null;
  updated_at?: string | null;
};

export type SerieVolumeBook = {
  id: string;
  slug: string;
  title: string;
  cover: string | null;
  volume: number | null;
  pages: number | null;
  readings: SerieVolumeReading[];
};

export type SerieDetailProps = {
  serie: SerieRow;
  authors: string[];
  books: SerieVolumeBook[];
  resolvedDates: {
    startDate: string | null;
    finishDate: string | null;
    lastActivity: string | null;
  };
  lastActivity: LastActivity | null;
};

/** Item renderizável no carrossel/lista — possivelmente um placeholder. */
type VolumeItem =
  | { kind: "book"; book: SerieVolumeBook; derivedStatus: VolumeStatus }
  | { kind: "placeholder"; volumeNumber: number };

type VolumeStatus = "reading" | "paused" | "finished" | "abandoned" | "tbr";

function pickDerivedStatus(book: SerieVolumeBook): VolumeStatus {
  const sorted = [...book.readings].sort((a, b) => {
    const af = a.finish_date ?? "";
    const bf = b.finish_date ?? "";
    if (af !== bf) return bf.localeCompare(af);
    const as = a.start_date ?? "";
    const bs = b.start_date ?? "";
    return bs.localeCompare(as);
  });
  const last = sorted[0];
  if (!last) return "tbr";
  return last.status as VolumeStatus;
}

function buildVolumeItems(
  books: SerieVolumeBook[],
  qtyVolumes: number | null,
): VolumeItem[] {
  const items: VolumeItem[] = books.map((b) => ({
    kind: "book" as const,
    book: b,
    derivedStatus: pickDerivedStatus(b),
  }));
  if (qtyVolumes && qtyVolumes > books.length) {
    const used = new Set(
      books
        .map((b) => b.volume)
        .filter((v): v is number => typeof v === "number"),
    );
    for (let v = 1; v <= qtyVolumes; v += 1) {
      if (!used.has(v) && items.filter((i) => i.kind === "placeholder").length + books.length < qtyVolumes) {
        items.push({ kind: "placeholder", volumeNumber: v });
      }
    }
  }
  return items;
}

function relativeFromNow(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  // Função simples (não Intl.RelativeTimeFormat) — controle total das
  // unidades em PT-BR sem fallbacks estranhos.
  if (diffDays < 1) return "hoje";
  if (diffDays === 1) return "há 1 dia";
  if (diffDays < 30) return `há ${diffDays} dias`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "há 1 mês";
  if (diffMonths < 12) return `há ${diffMonths} meses`;
  const diffYears = Math.floor(diffDays / 365);
  return diffYears === 1 ? "há 1 ano" : `há ${diffYears} anos`;
}

function durationBetween(
  startIso: string | null,
  endIso: string | null,
): string | null {
  if (!startIso || !endIso) return null;
  const a = new Date(startIso);
  const b = new Date(endIso);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  const ms = Math.abs(b.getTime() - a.getTime());
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 30) return `durou ${days} ${days === 1 ? "dia" : "dias"}`;
  const months = Math.floor(days / 30);
  if (months < 12)
    return `durou ${months} ${months === 1 ? "mês" : "meses"}`;
  const years = Math.floor(days / 365);
  const remMonths = Math.floor((days - years * 365) / 30);
  const yearLabel = `${years} ${years === 1 ? "ano" : "anos"}`;
  if (remMonths === 0) return `durou ${yearLabel}`;
  const monthLabel = `${remMonths} ${remMonths === 1 ? "mês" : "meses"}`;
  return `durou ${yearLabel} e ${monthLabel}`;
}

function shortMonthYear(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

const volumeBorderClass: Record<VolumeStatus | "missing", string> = {
  reading: "border-l-gold",
  paused: "border-l-olive",
  finished: "border-l-moss",
  abandoned: "border-l-burgundy",
  tbr: "border-l-ink-fade/40",
  missing: "border-l-ink-fade/20",
};

export default function SerieDetailClient({
  serie,
  authors,
  books,
  resolvedDates,
  lastActivity,
}: SerieDetailProps) {
  const router = useRouter();
  const [actionsOpen, setActionsOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState(false);
  const [, startTransition] = useTransition();

  const occupiedVolumes = books
    .map((b) => b.volume)
    .filter((v): v is number => typeof v === "number");

  const derivedCurrent = deriveCurrentVolume(books);
  const currentReadingBookId =
    derivedCurrent.currentReading?.book.id ?? null;
  const nextToReadBookId = derivedCurrent.nextToRead?.book.id ?? null;

  const handleDelete = () => {
    setPendingAction(true);
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteSerie(serie.id);
      setPendingAction(false);
      if (!result.ok) {
        setDeleteError(result.message);
        return;
      }
      setDeleteOpen(false);
      router.push("/serie");
    });
  };

  const handleUnlink = (bookId: string) => {
    setPendingAction(true);
    setUnlinkError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("book_id", bookId);
      fd.set("serie_slug", serie.slug);
      const result = await unlinkBookFromSerie(fd);
      setPendingAction(false);
      if (!result.ok) {
        setUnlinkError(result.message);
        return;
      }
      setUnlinkTarget(null);
      router.refresh();
    });
  };

  const volumeItems = buildVolumeItems(books, serie.qty_volumes);
  const total = serie.qty_volumes ?? null;
  const readCount = books.filter((b) =>
    b.readings.some((r) => r.status === "finished"),
  ).length;
  const status = serie.status;
  const percent =
    total != null && total > 0
      ? Math.min(100, Math.round((readCount / total) * 100))
      : status === "finished"
        ? 100
        : 0;

  // Determina cor da barra de progresso conforme status
  const progressBarColor =
    status === "finished"
      ? "bg-moss"
      : status === "abandoned"
        ? "bg-burgundy"
        : status === "paused"
          ? "bg-olive"
          : status === "reading"
            ? "bg-gold"
            : "bg-ink-fade/40";

  // Stats config — varia conforme serie.status
  const startedAtLabel = formatDate(resolvedDates.startDate) ?? "—";
  const lastActivityLabel = relativeFromNow(resolvedDates.lastActivity);
  const finishedAtLabel = formatDate(resolvedDates.finishDate) ?? "—";
  const duration = durationBetween(
    resolvedDates.startDate,
    resolvedDates.finishDate,
  );

  return (
    <div className="font-body max-w-4xl">
      <div className="mb-4">
        <BackButton fallback="/serie" label="Voltar para a lista" />
      </div>

      {/* Header com ações — sessão 17.3: wrapper com border-l-4 navy
          (série = saga / linha temporal). Bege passa a respirar; a barra
          lateral dá identidade visual sem virar carnaval. */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 pb-4 border-b border-border bg-ivory-light border-l-4 border-l-navy rounded-r-md pl-4 pt-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-4xl font-medium text-ink-deep leading-tight">
            {serie.name}
          </h1>
          {authors.length > 0 && (
            <p className="text-xl text-ink-soft italic mt-2">
              {authors.join(", ")}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <StatusBadge kind="serie" status={status} size="md" />
          </div>
          {serie.description && (
            <p className="mt-4 text-ink-deep leading-relaxed max-w-[560px]">
              {serie.description}
            </p>
          )}
          {serie.review &&
            (serie.status === "finished" || serie.status === "abandoned") && (
              <div className="mt-5 max-w-[560px]">
                <p className="text-[11px] uppercase tracking-wider text-ink-fade mb-1">
                  {serie.status === "abandoned"
                    ? "Por que abandonei"
                    : "Resenha"}
                </p>
                <p className="text-base italic text-ink-soft leading-relaxed whitespace-pre-line">
                  &ldquo;{serie.review}&rdquo;
                </p>
              </div>
            )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            as="Link"
            href={`/book/new?serie_id=${serie.id}&from=/serie/${serie.slug}`}
            variant="secondary"
            size="sm"
          >
            + Adicionar volume
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setLinkOpen(true)}
          >
            + Vincular livro existente
          </Button>
          <Button
            as="Link"
            href={`/serie/edit/${serie.id}?from=/serie/${serie.slug}`}
            variant="ghost"
            size="sm"
            leftIcon={<PencilSquareIcon className="w-4 h-4" />}
          >
            Editar
          </Button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setActionsOpen((o) => !o)}
              onBlur={() => setTimeout(() => setActionsOpen(false), 150)}
              aria-label="Mais ações"
              className="p-2 rounded-md border border-border bg-ivory-light text-ink-soft hover:text-ink-deep hover:bg-paper transition-colors"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {actionsOpen && (
              <div className="absolute right-0 mt-1 w-56 rounded-md border border-border bg-ivory-light shadow-lg z-20">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setDeleteOpen(true);
                    setActionsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-burgundy hover:bg-burgundy/10 transition-colors"
                >
                  Excluir série
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats — 4 cards horizontais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Lidos"
          value={total != null ? `${readCount}/${total}` : `${readCount}`}
          extra={
            total != null ? (
              <div className="h-[3px] bg-paper-soft rounded-full overflow-hidden mt-2">
                <div
                  className={clsx("h-full transition-all", progressBarColor)}
                  style={{ width: `${percent}%` }}
                />
              </div>
            ) : null
          }
        />
        <StatCard label="Comecei em" value={startedAtLabel} />
        {status === "finished" ? (
          <StatCard
            label="Concluí em"
            value={finishedAtLabel}
            italic={duration ?? undefined}
            italicClass="text-moss"
          />
        ) : status === "abandoned" ? (
          <StatCard
            label="Abandonei em"
            value={finishedAtLabel}
            italic={total ? `li ${readCount} de ${total}` : undefined}
          />
        ) : lastActivity ? (
          <LastActivityCard activity={lastActivity} />
        ) : (
          <StatCard label="Última atividade" value={lastActivityLabel} />
        )}
        <RatingCard rating={serie.rating} />
      </div>

      {/* Volumes — lista vertical */}
      <Card className="mb-6">
        <h2 className="font-display text-xl font-medium text-ink-deep mb-4 pb-3 border-b border-border">
          Volumes
        </h2>
        {volumeItems.length === 0 ? (
          <p className="text-sm italic text-ink-soft">
            Nenhum volume cadastrado ainda.{" "}
            <Link
              href={`/book/new?serie_id=${serie.id}&from=/serie/${serie.slug}`}
              className="text-gold-deep underline hover:text-ink-deep transition-colors"
            >
              Adicione o primeiro
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-2.5">
            {volumeItems.map((item, idx) => {
              const highlight =
                item.kind === "book"
                  ? item.book.id === currentReadingBookId
                    ? "current"
                    : item.book.id === nextToReadBookId
                      ? "next"
                      : null
                  : null;
              return (
                <VolumeRow
                  key={idx}
                  item={item}
                  serieId={serie.id}
                  serieSlug={serie.slug}
                  highlight={highlight}
                  onUnlink={(bookId, title) =>
                    setUnlinkTarget({ id: bookId, title })
                  }
                />
              );
            })}
          </ul>
        )}
      </Card>

      <LinkBookToSerieModal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        serieId={serie.id}
        serieSlug={serie.slug}
        occupiedVolumes={occupiedVolumes}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        title="Excluir série?"
        description={
          deleteError
            ? deleteError
            : `"${serie.name}" será removida. Os livros desta série continuam na sua biblioteca, mas perdem a referência. Esta ação não pode ser desfeita.`
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={pendingAction}
      />

      <ConfirmDialog
        open={unlinkTarget !== null}
        onClose={() => {
          setUnlinkTarget(null);
          setUnlinkError(null);
        }}
        onConfirm={() => {
          if (unlinkTarget) handleUnlink(unlinkTarget.id);
        }}
        title="Desvincular livro da série?"
        description={
          unlinkError
            ? unlinkError
            : unlinkTarget
              ? `"${unlinkTarget.title}" será removido da série ${serie.name}. O livro continua existindo na sua biblioteca, sem série atribuída.`
              : ""
        }
        confirmLabel="Desvincular"
        cancelLabel="Cancelar"
        loading={pendingAction}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  italic,
  italicClass,
  extra,
}: {
  label: string;
  value: string;
  italic?: string;
  italicClass?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-ivory-light p-4">
      <p className="text-[11px] uppercase tracking-wider text-ink-fade">
        {label}
      </p>
      <p className="font-display text-lg text-ink-deep mt-0.5 leading-tight">
        {value}
      </p>
      {italic && (
        <p className={clsx("text-xs italic mt-1", italicClass ?? "text-ink-fade")}>
          {italic}
        </p>
      )}
      {extra}
    </div>
  );
}

function LastActivityCard({ activity }: { activity: LastActivity }) {
  const verb = lastActivityVerb(activity);
  return (
    <div className="rounded-lg border border-border bg-ivory-light p-4">
      <p className="text-[11px] uppercase tracking-wider text-ink-fade">
        Última atividade
      </p>
      <p className="font-display text-lg text-ink-deep mt-0.5 leading-tight line-clamp-2">
        {verb}{" "}
        <span className="italic">{activity.book_title}</span>
      </p>
      <p className="text-xs italic text-ink-fade mt-1">
        {relativeFromNow(activity.date)}
      </p>
    </div>
  );
}

function RatingCard({ rating }: { rating: number | null }) {
  return (
    <div className="rounded-lg border border-border bg-ivory-light p-4">
      <p className="text-[11px] uppercase tracking-wider text-ink-fade">
        Avaliação geral
      </p>
      {rating ? (
        <p
          className="mt-1 text-lg leading-none"
          aria-label={`${rating} de 5 estrelas`}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={n <= rating ? "text-gold" : "text-border"}
            >
              ★
            </span>
          ))}
        </p>
      ) : (
        <p className="font-display text-lg text-ink-fade italic mt-0.5">—</p>
      )}
    </div>
  );
}

function VolumeRow({
  item,
  serieId,
  serieSlug,
  highlight,
  onUnlink,
}: {
  item: VolumeItem;
  serieId: string;
  serieSlug: string;
  highlight: "current" | "next" | null;
  onUnlink: (bookId: string, title: string) => void;
}) {
  if (item.kind === "placeholder") {
    return (
      <li
        className={clsx(
          "rounded-md border border-border border-l-[3px] bg-ivory-light p-3 flex items-center gap-3.5 opacity-70",
          volumeBorderClass.missing,
        )}
      >
        <div
          className="w-12 flex-shrink-0 rounded-sm border border-dashed border-border bg-paper-soft flex items-center justify-center"
          style={{ aspectRatio: "2 / 3" }}
        >
          <span className="font-display text-base text-ink-fade">
            #{item.volumeNumber}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-base font-medium text-ink-fade leading-tight">
            Volume {item.volumeNumber}
          </p>
          <p className="text-[11px] italic text-ink-fade mt-0.5">
            Não cadastrado ·{" "}
            <Link
              href={`/book/new?serie_id=${serieId}&volume=${item.volumeNumber}&from=/serie/${serieSlug}`}
              className="text-gold-deep underline hover:text-ink-deep transition-colors"
            >
              adicionar
            </Link>
          </p>
        </div>
      </li>
    );
  }

  const { book, derivedStatus } = item;
  const sorted = [...book.readings].sort((a, b) => {
    const af = a.finish_date ?? "";
    const bf = b.finish_date ?? "";
    if (af !== bf) return bf.localeCompare(af);
    const as = a.start_date ?? "";
    const bs = b.start_date ?? "";
    return bs.localeCompare(as);
  });
  const last = sorted[0];
  const finishedCount = book.readings.filter(
    (r) => r.status === "finished",
  ).length;

  let info: React.ReactNode;
  if (!last) {
    info = <span>Quero ler</span>;
  } else if (last.status === "finished") {
    const stars = last.rating ? `${last.rating}★` : null;
    info = (
      <>
        Lido em {shortMonthYear(last.finish_date)}
        {stars && ` · ${stars}`}
        {finishedCount > 1 && ` · relido ${finishedCount}x`}
      </>
    );
  } else if (last.status === "reading") {
    const pageInfo =
      last.current_page != null && book.pages
        ? ` · pág ${last.current_page} · ${Math.min(
            100,
            Math.round((last.current_page / book.pages) * 100),
          )}%`
        : last.current_page != null
          ? ` · pág ${last.current_page}`
          : "";
    info = (
      <>
        Iniciado em {shortMonthYear(last.start_date)}
        {pageInfo}
      </>
    );
  } else if (last.status === "paused") {
    info = (
      <>
        Pausado
        {last.current_page != null && ` · pág ${last.current_page}`}
        {last.start_date && ` · iniciado em ${shortMonthYear(last.start_date)}`}
      </>
    );
  } else {
    info = <>Abandonado em {shortMonthYear(last.finish_date)}</>;
  }

  // "Leitura atual" sobrescreve a cor da border lateral (vira gold mais
  // grossa); "próximo" usa olive.
  const borderClass =
    highlight === "current"
      ? "border-l-gold border-l-4"
      : highlight === "next"
        ? "border-l-olive border-l-4"
        : `${volumeBorderClass[derivedStatus]} border-l-[3px]`;

  return (
    <li
      className={clsx(
        "relative rounded-md border border-border bg-ivory-light hover:bg-paper transition-colors",
        borderClass,
      )}
    >
      {highlight && (
        <p
          className={clsx(
            "px-3 pt-2 text-[11px] uppercase tracking-wider font-display italic",
            highlight === "current" ? "text-gold-deep" : "text-olive",
          )}
        >
          {highlight === "current" ? "Leitura atual" : "Próximo a ler"}
        </p>
      )}
      {/* Stretched link cobre toda a li exceto o botão "Desvincular"
          (z-10). Usuário pode clicar em qualquer área pra ir pra detail
          do livro; o botão de desvincular intercepta seu próprio clique. */}
      <Link
        href={`/book/${book.slug}`}
        aria-label={`Ver detalhes de ${book.title}`}
        className="absolute inset-0 z-[1] rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
      />
      <div className="flex items-center gap-3.5 p-3">
        <div
          className="w-12 flex-shrink-0 relative rounded-sm overflow-hidden border border-ink-deep/20"
          style={{ aspectRatio: "2 / 3" }}
        >
          {book.cover ? (
            <Image
              src={imagesUrl(book.cover)}
              alt={`Capa de ${book.title}`}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            // No contexto de série, mostra o número do volume na "capa" em
            // vez do ícone genérico — ajuda a identificar visualmente qual é
            // o vol 4 quando nenhum tem cover real. bg-cappuccino agora é
            // marrom-café escuro (sessão 17.x).
            <div
              className="absolute inset-0 flex items-center justify-center bg-cappuccino"
              role="img"
              aria-label={`Volume ${book.volume ?? "?"}`}
            >
              <span className="font-display italic font-medium text-base text-gold leading-none">
                {book.volume ?? "?"}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="font-display text-base font-medium text-ink-deep leading-tight line-clamp-1">
            {book.volume != null && (
              <span className="text-ink-fade italic mr-1">
                Vol. {book.volume}
              </span>
            )}
            {book.title}
          </p>
          <p className="text-[11px] italic text-ink-fade leading-tight">
            {info}
          </p>
          {last?.status === "reading" &&
            book.pages &&
            last.current_page != null && (
              <div className="h-1 bg-paper-soft rounded-full overflow-hidden mt-1.5 max-w-[200px]">
                <div
                  className="h-full bg-gold transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((last.current_page / book.pages) * 100),
                    )}%`,
                  }}
                />
              </div>
            )}
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 relative z-10">
          <StatusBadge
            kind="reading"
            status={derivedStatus as LegacyReadingStatus}
            size="sm"
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onUnlink(book.id, book.title);
            }}
            aria-label={`Desvincular ${book.title} da série`}
            title="Desvincular da série"
            className="p-1.5 rounded text-ink-soft hover:text-burgundy hover:bg-burgundy/10 transition-colors"
          >
            <LinkSlashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

