"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  Badge,
  StatusBadge,
  Button,
  BackButton,
  ConfirmDialog,
  BookCoverFallback,
  pickBookCoverColor,
  RatingStars,
} from "@/components/ui";
import BookshelfDecoration from "@/components/ui/BookshelfDecoration";
import type { LegacyReadingStatus } from "@/components/ui/StatusBadge";
import ReadingFormModal from "@/components/forms/ReadingFormModal";
import QuoteFormModal from "@/components/forms/QuoteFormModal";
import DisposeBookModal from "@/components/forms/DisposeBookModal";
import PauseReadingModal from "@/components/forms/PauseReadingModal";
import ResumeReadingModal from "@/components/forms/ResumeReadingModal";
import FinishReadingModal from "@/components/forms/FinishReadingModal";
import AbandonReadingModal from "@/components/forms/AbandonReadingModal";
import { deleteReading } from "@/actions/deleteReading";
import { deleteQuoteById } from "@/actions/createQuoteForBook";
import { deleteBook } from "@/actions/deleteBook";
import { startReading } from "@/actions/startReading";
import { formatDate } from "@/utils/formatDate";
import { formatDuration, formatDurationLabel } from "@/utils/formatDuration";
import { labelForPurchaseOrigin } from "@/utils/labels";
import {
  EllipsisVerticalIcon,
  PencilSquareIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  HeartIcon as HeartOutlineIcon,
} from "@heroicons/react/24/outline";
import {
  BookmarkIcon,
  HeartIcon as HeartSolidIcon,
} from "@heroicons/react/24/solid";
import { toggleBookFavorite } from "@/actions/toggleBookFavorite";
import type { Database } from "@/utils/typings/supabase";

type ReadingStatus = Database["public"]["Enums"]["reading_status"];
type ReadingEventType = Database["public"]["Enums"]["reading_event_type"];
type BookFormat = Database["public"]["Enums"]["book_format"];
type OwnershipStatus = Database["public"]["Enums"]["ownership_status"];
type PurchaseOrigin = Database["public"]["Enums"]["purchase_origin"];

export type BookDetail = {
  id: string;
  slug: string;
  title: string;
  original_title: string | null;
  isbn: string | null;
  publisher: string | null;
  publication_year: number | null;
  synopsis: string | null;
  pages: number | null;
  language: Database["public"]["Enums"]["book_language"] | null;
  cover: string | null;
  cover_url: string;
  serie_id: string | null;
  serie_name: string | null;
  serie_slug: string | null;
  volume: number | null;
  ownership_status: OwnershipStatus;
  disposed_date: string | null;
  formats_owned: BookFormat[] | null;
  comments: string | null;
  is_favorite: boolean;
  wont_read: boolean;
  purchase_origin: PurchaseOrigin | null;
  purchase_price: number | null;
  acquired_at: string | null;
  borrowed_from: string | null;
  borrowed_at: string | null;
  returned_at: string | null;
  returned_to_acervo_at: string | null;
  lent_to: string | null;
  subscription: { id: string; name: string } | null;
  /** Outros livros que vieram no mesmo exemplar físico (omnibus). */
  bundled: { id: string; slug: string; title: string }[];
  /** Sumário (contos / capítulos), pra coletâneas e edições com TOC custom. */
  table_of_contents: { title: string; page_start: number | null }[];
  /** Grupo de compra (box/kit) quando o livro veio em um conjunto. */
  purchase_group: {
    id: string;
    name: string;
    total_price: number;
    book_count: number;
  } | null;
};

export type ReadingEventItem = {
  id: string;
  event_type: ReadingEventType;
  event_date: string;
  notes: string | null;
};

export type ReadingItem = {
  id: string;
  status: ReadingStatus;
  format: BookFormat | null;
  start_date: string | null;
  finish_date: string | null;
  current_page: number | null;
  rating: number | null;
  review: string | null;
  events: ReadingEventItem[];
};

export type BookStatusHistoryItem = {
  id: string;
  status: OwnershipStatus;
  changed_at: string;
  notes: string | null;
};

export type QuoteItem = {
  id: string;
  slug: string;
  text: string;
  page: number | null;
  chapter: string | null;
  author_name: string | null;
  note: string | null;
};

const languageLabels: Record<
  Database["public"]["Enums"]["book_language"],
  string
> = {
  pt_BR: "Português (BR)",
  en: "Inglês",
  es: "Espanhol",
  fr: "Francês",
  it: "Italiano",
  de: "Alemão",
  ja: "Japonês",
  other: "Outro",
};

const formatLabels: Record<BookFormat, string> = {
  physical: "Físico",
  ebook: "E-book",
  audiobook: "Audiobook",
};

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatLongDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/**
 * Texto descritivo de um evento de history. Para `owned`, depende do contexto
 * (primeira ocorrência → "Entrou no acervo"; depois de outro estado → "Voltou").
 *
 * @param entry         entrada atual da history
 * @param previous      entrada anterior (cronológica) — null se é a primeira
 * @param book          dados do livro pra contextualizar (origin, borrowed_from, lent_to)
 */
function describeHistoryEvent(
  entry: BookStatusHistoryItem,
  previous: BookStatusHistoryItem | null,
  book: { borrowed_from: string | null; lent_to: string | null; purchase_origin: PurchaseOrigin | null },
): string {
  switch (entry.status) {
    case "owned": {
      if (!previous) {
        const originLabel = book.purchase_origin
          ? labelForPurchaseOrigin(book.purchase_origin).toLowerCase()
          : null;
        return originLabel
          ? `Entrou no acervo · ${originLabel}`
          : "Entrou no acervo";
      }
      if (previous.status === "borrowed") {
        return "Comprou (entrou no acervo)";
      }
      if (previous.status === "lent_out") {
        return "Voltou pro acervo";
      }
      return "Voltou ao estado em casa";
    }
    case "lent_out":
      return book.lent_to
        ? `Emprestado para ${book.lent_to}`
        : "Emprestado pra alguém";
    case "borrowed":
      return book.borrowed_from
        ? `Emprestado de ${book.borrowed_from}`
        : "Pegou emprestado";
    case "returned":
      return book.borrowed_from
        ? `Devolveu para ${book.borrowed_from}`
        : "Devolveu";
    case "donated":
      return "Doei";
    case "sold":
      return "Vendi";
    case "traded":
      return "Troquei";
    case "lost":
      return "Perdi";
    case "kindle":
    case "audible": {
      // Plataformas digitais — narrativa mais leve. Primeira ocorrência =
      // entrou no acervo; transição entre digitais = mudou de plataforma.
      const platform = entry.status === "kindle" ? "Kindle" : "Audible";
      if (!previous) {
        const originLabel = book.purchase_origin
          ? labelForPurchaseOrigin(book.purchase_origin).toLowerCase()
          : null;
        return originLabel
          ? `Entrou no acervo (${platform}) · ${originLabel}`
          : `Entrou no acervo (${platform})`;
      }
      return `Disponível no ${platform}`;
    }
  }
}

function PosseTimeline({
  history,
  book,
}: {
  history: BookStatusHistoryItem[];
  book: BookDetail;
}) {
  // History já vem ordenada cronologicamente ascendente (server side).
  return (
    <ol className="relative border-l-2 border-border pl-4 space-y-3">
      {history.map((h, idx) => {
        const previous = idx > 0 ? history[idx - 1] : null;
        const desc = describeHistoryEvent(h, previous, book);
        // Mesma lógica do `acquired_at`: a action salva NOW() como
        // placeholder quando o user deixa a data em branco, então a UI
        // detecta o caso pelo campo source no book e mostra "sem data
        // informada". Vale pra todos os eventos com datas opcionais:
        // entrada (acquired_at), saída (disposed_date), pegou emprestado
        // (borrowed_at) e devolveu (returned_at).
        const isFirstEntry = idx === 0;
        const isDisposalEvent =
          h.status === "donated" ||
          h.status === "sold" ||
          h.status === "traded" ||
          h.status === "lost";
        // Re-entrada no acervo (owned mas não é a primeira entry) é
        // governada pelo `returned_to_acervo_at`.
        const isReEntryToOwned = h.status === "owned" && !isFirstEntry;
        const showNoDate =
          (isFirstEntry && !book.acquired_at) ||
          (isDisposalEvent && !book.disposed_date) ||
          (h.status === "borrowed" && !book.borrowed_at) ||
          (h.status === "returned" && !book.returned_at) ||
          (isReEntryToOwned && !book.returned_to_acervo_at);
        return (
          <li key={h.id} className="relative">
            <span
              aria-hidden
              className="absolute -left-[1.4rem] top-1.5 w-2.5 h-2.5 rounded-full bg-cappuccino border-2 border-paper"
            />
            <p className="font-mono text-[11px] text-ink-fade">
              {showNoDate
                ? "sem data informada"
                : formatDate(h.changed_at) ?? h.changed_at.slice(0, 10)}
            </p>
            <p className="text-sm text-ink-deep">{desc}</p>
          </li>
        );
      })}
    </ol>
  );
}

export default function BookDetailClient({
  book,
  authors,
  categories,
  readings,
  quotes,
  statusHistory = [],
}: {
  book: BookDetail;
  authors: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  readings: ReadingItem[];
  quotes: QuoteItem[];
  statusHistory?: BookStatusHistoryItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [readingModal, setReadingModal] = useState<{
    open: boolean;
    reading: ReadingItem | null;
  }>({ open: false, reading: null });
  const [quoteModal, setQuoteModal] = useState<{
    open: boolean;
    quote: QuoteItem | null;
  }>({ open: false, quote: null });
  const [pauseTarget, setPauseTarget] = useState<string | null>(null);
  const [resumeTarget, setResumeTarget] = useState<string | null>(null);
  const [finishTarget, setFinishTarget] = useState<string | null>(null);
  const [abandonTarget, setAbandonTarget] = useState<string | null>(null);
  const [readingActionsOpen, setReadingActionsOpen] = useState<string | null>(
    null,
  );
  const [disposeOpen, setDisposeOpen] = useState(false);
  const [deleteBookOpen, setDeleteBookOpen] = useState(false);
  const [deleteReadingId, setDeleteReadingId] = useState<string | null>(null);
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState(false);
  // Estado otimista do coração — mesmo pattern do BookCard.
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

  // Auto-abre o modal de nova leitura via ?action=new-reading
  useEffect(() => {
    if (searchParams.get("action") === "new-reading") {
      setReadingModal({ open: true, reading: null });
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : `/book/${book.slug}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Última leitura para o badge no hero. Sem leitura, deriva da flag
  // `wont_read`: "não vou ler" se marcada, "quero ler" (tbr) se não.
  const latestReading = readings[0] ?? null;
  const latestStatus: LegacyReadingStatus =
    (latestReading?.status as LegacyReadingStatus | null) ??
    (book.wont_read ? "wont_read" : "tbr");

  // Leitura em andamento mais recente (start_date desc) — alimenta o bloco
  // "Leitura atual" no hero. Ignora "paused" e demais status.
  const activeReading =
    readings
      .filter((r) => r.status === "reading")
      .slice()
      .sort((a, b) => {
        const ad = a.start_date ?? "";
        const bd = b.start_date ?? "";
        return bd.localeCompare(ad);
      })[0] ?? null;
  const activePercent =
    activeReading && book.pages && book.pages > 0 && activeReading.current_page
      ? Math.min(
          100,
          Math.round((activeReading.current_page / book.pages) * 100),
        )
      : 0;
  const longDate = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  };

  // "Começou em" canônico de uma reading: event_date do `started` mais antigo
  // (caso re-abra leitura, queremos preservar a ordem original) ou fallback
  // para reading.start_date. Retorna string vazia pra colocar nulls no fim.
  function startedDateOf(r: ReadingItem): string {
    const startedEvents = r.events
      .filter((e) => e.event_type === "started")
      .map((e) => e.event_date)
      .sort();
    if (startedEvents.length > 0) return startedEvents[0];
    return r.start_date ?? "";
  }

  // Numeração ordinal **fixa** por ordem cronológica de quando cada reading
  // foi iniciada. Inclui readings em andamento — então "1ª leitura" é sempre
  // a primeira começada, mesmo que ainda não tenha terminado.
  // Fonte do "começou em": event_date do `started` mais antigo da reading;
  // fallback para reading.start_date se não há events.
  const ordinalSortedAsc = readings
    .slice()
    .sort((a, b) => {
      const aStart = startedDateOf(a);
      const bStart = startedDateOf(b);
      return aStart.localeCompare(bStart);
    });
  const ordinalById = new Map<string, number>();
  ordinalSortedAsc.forEach((r, i) => ordinalById.set(r.id, i + 1));

  // Mapeamento status → cor pra border-l e label de leituras.
  const statusBorderClass: Record<string, string> = {
    reading: "border-l-gold",
    paused: "border-l-olive",
    finished: "border-l-moss",
    abandoned: "border-l-burgundy",
  };
  const statusLabelClass: Record<string, string> = {
    reading: "text-gold-deep",
    paused: "text-olive",
    finished: "text-moss",
    abandoned: "text-burgundy",
  };

  const [actionError, setActionError] = useState<string | null>(null);

  const handleDeleteBook = () => {
    setPendingAction(true);
    setActionError(null);
    startTransition(async () => {
      const result = await deleteBook(book.id);
      setPendingAction(false);
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setDeleteBookOpen(false);
      router.push("/book");
    });
  };

  const handleDeleteReading = (id: string) => {
    setPendingAction(true);
    setActionError(null);
    startTransition(async () => {
      const result = await deleteReading(id, book.slug);
      setPendingAction(false);
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setDeleteReadingId(null);
      router.refresh();
    });
  };

  const handleDeleteQuote = (id: string) => {
    setPendingAction(true);
    setActionError(null);
    startTransition(async () => {
      const result = await deleteQuoteById(id, book.slug);
      setPendingAction(false);
      if (!result.ok) {
        setActionError(result.message);
        return;
      }
      setDeleteQuoteId(null);
      router.refresh();
    });
  };

  const handleStartReading = (id: string) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("book_slug", book.slug);
      const result = await startReading(fd);
      if (result.ok) {
        router.refresh();
      } else {
        setActionError(result.message);
      }
    });
  };

  // Labels e ordem dos events na linha do tempo. Ordem cronológica é decidida
  // pela `event_date`, não pela ordem dos labels — labels só pra exibição.
  const eventLabels: Record<ReadingEventType, string> = {
    started: "iniciada",
    paused: "pausada",
    resumed: "retomada",
    finished: "concluída",
    abandoned: "abandonada",
  };
  const formatEventDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
  };

  // Calcula a duração de uma reading a partir dos events. Pra leitura em
  // andamento (status reading/paused), começa no started mais recente até
  // hoje. Pra leitura fechada (finished/abandoned), do started mais recente
  // até o event de fechamento.
  const durationFor = (r: ReadingItem): string | null => {
    const sorted = [...r.events].sort((a, b) =>
      a.event_date.localeCompare(b.event_date),
    );
    const lastStarted =
      [...sorted].reverse().find((e) => e.event_type === "started") ?? null;
    const startDate = lastStarted?.event_date ?? r.start_date;
    if (!startDate) return null;
    if (r.status === "finished" || r.status === "abandoned") {
      const closing = [...sorted]
        .reverse()
        .find(
          (e) => e.event_type === "finished" || e.event_type === "abandoned",
        );
      const endDate = closing?.event_date ?? r.finish_date;
      if (!endDate) return null;
      return formatDurationLabel(startDate, endDate);
    }
    if (r.status === "reading") {
      return formatDuration(startDate, null).replace(/^há /, "Lendo há ");
    }
    if (r.status === "paused") {
      return `${formatDuration(startDate, null).replace(/^há /, "Lendo há ")} (pausada)`;
    }
    return null;
  };

  const coverColor = pickBookCoverColor(book.title);

  return (
    <div className="font-body max-w-4xl">
      <div className="mb-4">
        <BackButton fallback="/book" label="Voltar para a lista" />
      </div>

      {/* Header com ações — faixa lateral + gradiente do fundo derivam da
          "cor de capa" do livro (mesma do BookCoverFallback), criando
          identidade visual mesmo quando há capa real. Gradiente fade pra
          ivory-light pra preservar contraste à direita, onde ficam os botões. */}
      <div
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 border border-border rounded-r-md pl-5 pr-4 pt-4 pb-3 shadow-sm"
        style={{
          borderLeft: `4px solid ${coverColor.hex}`,
          background: `linear-gradient(95deg, ${coverColor.hex}33 0%, ${coverColor.hex}14 40%, var(--color-ivory-light) 80%)`,
        }}
      >
        <div className="min-w-0">
          <h1 className="font-display text-4xl font-medium text-ink-deep leading-tight">
            {book.title}
          </h1>
          {book.original_title && (
            <p className="font-display italic text-lg text-ink-fade mt-1">
              {book.original_title}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-nowrap flex-shrink-0">
          <button
            type="button"
            aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            aria-pressed={favorite}
            disabled={favPending}
            onClick={handleFavoriteToggle}
            className={`p-2 rounded-md border border-border bg-ivory-light transition-colors ${
              favorite
                ? "text-burgundy hover:bg-burgundy/10"
                : "text-ink-soft hover:text-ink-deep hover:bg-paper"
            } ${favPending ? "opacity-60 cursor-wait" : ""}`}
          >
            {favorite ? (
              <HeartSolidIcon className="w-5 h-5" />
            ) : (
              <HeartOutlineIcon className="w-5 h-5" />
            )}
          </button>
          <Button
            type="button"
            variant="accent-moss"
            size="sm"
            onClick={() => setReadingModal({ open: true, reading: null })}
          >
            Anotar leitura
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setQuoteModal({ open: true, quote: null })}
          >
            Adicionar citação
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
                <Link
                  href={`/book/edit/${book.id}?from=/book/${book.slug}`}
                  className="block px-4 py-2 text-sm text-ink-deep hover:bg-paper transition-colors"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  Editar livro
                </Link>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setDisposeOpen(true);
                    setActionsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-ink-deep hover:bg-paper transition-colors"
                >
                  Marcar como vendido/doado
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setDeleteBookOpen(true);
                    setActionsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-burgundy hover:bg-burgundy/10 transition-colors border-t border-border"
                >
                  Excluir livro
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
      <Card>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 flex-shrink-0">
            <div
              className="relative w-full max-w-xs mx-auto md:mx-0"
              style={{ aspectRatio: "2 / 3" }}
            >
              {book.cover ? (
                <Image
                  src={book.cover_url}
                  alt={`Capa de ${book.title}`}
                  fill
                  className="object-cover rounded-md border border-ink-deep/30 shadow-md"
                  priority
                  sizes="(max-width: 768px) 100vw, 280px"
                />
              ) : (
                <BookCoverFallback
                  title={book.title}
                  size="lg"
                  className="w-full h-full"
                />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {authors.length > 0 && (
              <p className="text-xl text-ink-soft italic mb-3">
                {authors.map((a) => a.name).join(", ")}
              </p>
            )}

            {book.serie_name && (
              <p className="font-body text-ink-soft mb-3">
                <span className="text-ink-fade italic">Série:</span>{" "}
                <span className="text-ink-deep">{book.serie_name}</span>
                {book.volume && (
                  <span className="text-ink-fade italic"> · vol. {book.volume}</span>
                )}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <StatusBadge kind="reading" status={latestStatus} />
              <StatusBadge kind="ownership" status={book.ownership_status} />
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {book.isbn && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-ink-fade">
                    ISBN
                  </dt>
                  <dd className="text-ink-deep">{book.isbn}</dd>
                </div>
              )}
              {book.publisher && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-ink-fade">
                    Editora
                  </dt>
                  <dd className="text-ink-deep">{book.publisher}</dd>
                </div>
              )}
              {book.publication_year && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-ink-fade">
                    Ano
                  </dt>
                  <dd className="text-ink-deep">{book.publication_year}</dd>
                </div>
              )}
              {book.pages && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-ink-fade">
                    Páginas
                  </dt>
                  <dd className="text-ink-deep">{book.pages}</dd>
                </div>
              )}
            </dl>

            {/* Leitura ativa: barra de progresso + data de início */}
            {activeReading && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-ink-fade font-medium mb-1.5">
                  Leitura atual
                </p>
                {book.pages && activeReading.current_page ? (
                  <div className="h-1 bg-paper-soft rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full bg-gold transition-all"
                      style={{ width: `${activePercent}%` }}
                    />
                  </div>
                ) : null}
                <p className="text-xs text-ink-fade italic inline-flex items-center gap-1 flex-wrap">
                  {book.pages && activeReading.current_page ? (
                    <span className="inline-flex items-center gap-1 not-italic">
                      <BookmarkIcon
                        className="w-3 h-3 text-gold-deep/70"
                        aria-hidden
                      />
                      <span className="italic">
                        {activeReading.current_page}/{book.pages} ·{" "}
                        {activePercent}%
                      </span>
                      <span className="italic">·</span>
                    </span>
                  ) : null}
                  começou em {longDate(activeReading.start_date)}
                </p>
              </div>
            )}

            {/* Informações de acervo: adquirido em, origem, preço, box,
                assinatura, empréstimo. Substitui a sinopse no hero (que
                agora aparece só no card "Sobre o livro" embaixo, sem
                duplicação). Fallback pra sinopse compacta quando o livro
                não tem nenhuma informação de acervo. */}
            {(() => {
              const items: { label: string; value: string }[] = [];
              if (book.acquired_at) {
                items.push({
                  label: "Adquirido em",
                  value: formatLongDate(book.acquired_at),
                });
              }
              if (book.purchase_origin) {
                items.push({
                  label: "Origem",
                  value: labelForPurchaseOrigin(book.purchase_origin),
                });
              }
              if (book.purchase_price !== null) {
                items.push({
                  label: "Preço",
                  value: formatBRL(book.purchase_price),
                });
              }
              if (book.purchase_group) {
                items.push({
                  label: "Box / kit",
                  value: book.purchase_group.name,
                });
              }
              if (book.subscription) {
                items.push({
                  label: "Assinatura",
                  value: book.subscription.name,
                });
              }
              if (book.lent_to) {
                items.push({ label: "Emprestado para", value: book.lent_to });
              }
              if (book.borrowed_from) {
                items.push({
                  label: "Emprestado de",
                  value: book.borrowed_from,
                });
              }
              if (
                book.disposed_date &&
                (book.ownership_status === "donated" ||
                  book.ownership_status === "sold" ||
                  book.ownership_status === "traded" ||
                  book.ownership_status === "lost")
              ) {
                items.push({
                  label: "Saiu em",
                  value: formatLongDate(book.disposed_date),
                });
              }
              if (items.length === 0) {
                if (!book.synopsis) return null;
                return (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wider text-ink-fade font-medium mb-1.5">
                      Sinopse
                    </p>
                    <p className="text-sm text-ink-deep leading-relaxed line-clamp-4">
                      {book.synopsis}
                    </p>
                  </div>
                );
              }
              return (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wider text-ink-fade font-medium mb-1.5">
                    Acervo
                  </p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    {items.map((it, i) => (
                      <div key={i}>
                        <dt className="text-xs uppercase tracking-wider text-ink-fade">
                          {it.label}
                        </dt>
                        <dd className="text-ink-deep">{it.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })()}
          </div>
        </div>
      </Card>

      {/* Sobre o livro */}
      <Card className="mt-6">
        <h2 className="font-display text-xl font-medium text-ink-deep mb-4 pb-3 border-b border-border">
          Sobre o livro
        </h2>
        {book.synopsis ? (
          <p className="text-ink-deep whitespace-pre-line mb-5 leading-relaxed">
            {book.synopsis}
          </p>
        ) : (
          <p className="text-ink-fade italic mb-5">Sem sinopse.</p>
        )}

        {categories.length > 0 && (
          <div className="mb-5">
            <p className="text-xs uppercase tracking-wider text-ink-fade mb-2">
              Categorias
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Badge key={c.id} variant="olive" size="sm">
                  {c.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          {book.language && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink-fade">
                Idioma
              </dt>
              <dd className="text-ink-deep">{languageLabels[book.language]}</dd>
            </div>
          )}
          {book.formats_owned && book.formats_owned.length > 0 && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink-fade">
                Formatos
              </dt>
              <dd className="text-ink-deep">
                {book.formats_owned.map((f) => formatLabels[f]).join(", ")}
              </dd>
            </div>
          )}
        </dl>

        {book.bundled.length > 0 && (
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs uppercase tracking-wider text-ink-fade mb-2">
              Mesmo exemplar
            </p>
            <ul className="space-y-1">
              {book.bundled.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/book/${b.slug}`}
                    className="text-sm text-gold-deep hover:text-ink-deep underline-offset-2 hover:underline transition-colors"
                  >
                    {b.title}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-xs italic text-ink-fade mt-1.5">
              Esta edição física inclui {book.bundled.length === 1 ? "também" : "também os livros acima"}.
            </p>
          </div>
        )}

        {book.table_of_contents.length > 0 && (
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs uppercase tracking-wider text-ink-fade mb-2">
              Sumário
            </p>
            <ol className="space-y-1 text-sm text-ink-deep">
              {book.table_of_contents.map((item, idx) => (
                <li key={idx} className="flex items-baseline gap-2">
                  <span className="text-ink-fade text-xs w-5 flex-shrink-0 text-right">
                    {idx + 1}.
                  </span>
                  <span className="flex-1">{item.title}</span>
                  {item.page_start != null && (
                    <span className="text-xs italic text-ink-fade">
                      p. {item.page_start}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </Card>

      {/* Histórico do acervo — timeline de eventos (compra, empréstimo,
          devolução, doação, etc.). O estado atual + contexto (adquirido em,
          origem, preço…) agora vivem no hero; aqui ficou só a história. */}
      <Card className="mt-6 relative overflow-hidden">
        {book.ownership_status === "owned" && (
          <BookshelfDecoration
            className="hidden lg:block absolute right-5 bottom-5 pointer-events-none"
          />
        )}
        <div className="relative z-10">
          <h2 className="font-display text-xl font-medium text-ink-deep mb-4 pb-3 border-b border-border">
            Histórico do acervo
          </h2>
          {statusHistory.length === 0 ? (
            <p className="text-sm italic text-ink-fade">
              Sem eventos registrados.
            </p>
          ) : (
            <PosseTimeline history={statusHistory} book={book} />
          )}
        </div>
      </Card>

      {/* Leituras */}
      {readings.length > 0 && (
        <Card className="mt-6">
          <h2 className="font-display text-xl font-medium text-ink-deep mb-4 pb-3 border-b border-border">
            Leituras
          </h2>
          <ul className="space-y-4">
            {readings.map((r) => {
              const ordinal = ordinalById.get(r.id);
              const ordinalLabel = ordinal ? `${ordinal}ª leitura` : null;
              const isCurrent = r.status === "reading" || r.status === "paused";
              const labelClass =
                statusLabelClass[r.status] ?? "text-ink-fade";
              const borderClass =
                statusBorderClass[r.status] ?? "border-l-border";
              const showProgressBar =
                r.status === "reading" &&
                book.pages &&
                book.pages > 0 &&
                r.current_page !== null &&
                r.current_page !== undefined;
              const progressPercent = showProgressBar
                ? Math.min(
                    100,
                    Math.round(((r.current_page ?? 0) / book.pages!) * 100),
                  )
                : 0;
              const durationText = durationFor(r);
              const sortedEvents = [...r.events].sort((a, b) =>
                a.event_date.localeCompare(b.event_date),
              );
              // Fallback sintético: quando a reading foi cadastrada com
              // `start_date`/`finish_date` direto (sem passar pelo fluxo de
              // "iniciar/terminar" que insere events), `reading_event` fica
              // vazio e a linha do tempo somia. Sintetiza events só pra
              // exibição — não persiste no banco.
              const timelineEvents =
                sortedEvents.length > 0
                  ? sortedEvents
                  : [
                      ...(r.start_date
                        ? [
                            {
                              id: `synthetic-start-${r.id}`,
                              event_type: "started" as ReadingEventType,
                              event_date: r.start_date,
                              notes: null,
                            },
                          ]
                        : []),
                      ...(r.finish_date &&
                      (r.status === "finished" || r.status === "abandoned")
                        ? [
                            {
                              id: `synthetic-end-${r.id}`,
                              event_type: (r.status === "abandoned"
                                ? "abandoned"
                                : "finished") as ReadingEventType,
                              event_date: r.finish_date,
                              notes: null,
                            },
                          ]
                        : []),
                    ];
              const moreActionsOpen = readingActionsOpen === r.id;

              return (
                <li
                  key={r.id}
                  className={`rounded-md border border-border ${borderClass} border-l-4 bg-paper/40 p-6 relative`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2.5">
                      {ordinalLabel && (
                        <div className="space-y-0.5">
                          <p
                            className={`font-display text-lg italic ${labelClass}`}
                          >
                            {ordinalLabel}
                          </p>
                          {isCurrent && (
                            <p className="font-display text-sm italic text-gold-deep">
                              Leitura atual
                            </p>
                          )}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                          kind="reading"
                          status={r.status as LegacyReadingStatus}
                          size="md"
                        />
                        {r.format && (
                          <Badge variant="fade" size="md">
                            {formatLabels[r.format]}
                          </Badge>
                        )}
                        {durationText && (
                          <span className="text-sm italic text-ink-fade">
                            {durationText}
                          </span>
                        )}
                      </div>

                      {showProgressBar && (
                        <div>
                          <div className="h-1 bg-paper-soft rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gold transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <p className="text-sm text-ink-fade italic mt-1 inline-flex items-center gap-1">
                            <BookmarkIcon
                              className="w-3.5 h-3.5 text-gold-deep/70 not-italic"
                              aria-hidden
                            />
                            Página atual: {r.current_page} · {progressPercent}%
                            lido
                          </p>
                        </div>
                      )}

                      {!showProgressBar &&
                        r.current_page !== null &&
                        r.status === "paused" && (
                          <p className="text-base text-ink-fade italic">
                            Página atual: {r.current_page}
                          </p>
                        )}

                      {r.review && (
                        <details className="text-base group/review">
                          <summary className="cursor-pointer text-ink-fade italic hover:text-ink-deep list-none">
                            ler resenha
                          </summary>
                          <p className="mt-2 text-base italic text-ink-soft leading-relaxed line-clamp-3 group-open/review:line-clamp-none">
                            &ldquo;{r.review}&rdquo;
                          </p>
                        </details>
                      )}

                      {timelineEvents.length > 0 && (
                        <details className="text-sm group/timeline">
                          <summary className="cursor-pointer text-ink-fade italic hover:text-ink-deep list-none inline-flex items-center gap-1">
                            <span>Ver linha do tempo</span>
                            <span className="transition-transform duration-150 group-open/timeline:rotate-180">
                              ▾
                            </span>
                          </summary>
                          <ul className="mt-2 space-y-1 pl-3 border-l border-border">
                            {timelineEvents.map((ev) => (
                              <li
                                key={ev.id}
                                className="flex gap-2 text-ink-soft"
                              >
                                <span className="font-body italic w-24 flex-shrink-0">
                                  {eventLabels[ev.event_type]}
                                </span>
                                <span className="text-ink-deep">
                                  {formatEventDate(ev.event_date)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 sm:flex-shrink-0">
                      {r.rating != null && r.status === "finished" && (
                        <RatingStars value={r.rating} size="text-lg" />
                      )}

                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {r.status === "reading" && (
                          <>
                            <button
                              type="button"
                              onClick={() => setPauseTarget(r.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-olive hover:bg-olive/10 transition-colors"
                              title="Pausar leitura"
                            >
                              <PauseIcon className="w-4 h-4" />
                              Pausar
                            </button>
                            <button
                              type="button"
                              onClick={() => setFinishTarget(r.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-moss hover:bg-moss/10 transition-colors"
                              title="Marcar como lida"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                              Concluir
                            </button>
                          </>
                        )}
                        {r.status === "paused" && (
                          <>
                            <button
                              type="button"
                              onClick={() => setResumeTarget(r.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gold-deep hover:bg-gold/10 transition-colors"
                              title="Retomar leitura"
                            >
                              <PlayIcon className="w-4 h-4" />
                              Retomar
                            </button>
                            <button
                              type="button"
                              onClick={() => setFinishTarget(r.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-moss hover:bg-moss/10 transition-colors"
                              title="Marcar como lida"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                              Concluir
                            </button>
                          </>
                        )}
                        {r.status === "abandoned" && (
                          <button
                            type="button"
                            onClick={() => setResumeTarget(r.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gold-deep hover:bg-gold/10 transition-colors"
                            title="Retomar leitura"
                          >
                            <PlayIcon className="w-4 h-4" />
                            Retomar
                          </button>
                        )}

                        {/* Dropdown "..." pra ações secundárias. Para reading
                            e paused inclui "Abandonar"; pra todos: editar +
                            excluir. */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setReadingActionsOpen((o) =>
                                o === r.id ? null : r.id,
                              )
                            }
                            onBlur={() =>
                              setTimeout(
                                () =>
                                  setReadingActionsOpen((o) =>
                                    o === r.id ? null : o,
                                  ),
                                150,
                              )
                            }
                            aria-label="Mais ações da leitura"
                            className="p-1 rounded text-ink-soft hover:text-ink-deep hover:bg-paper transition-colors"
                          >
                            <EllipsisVerticalIcon className="w-4 h-4" />
                          </button>
                          {moreActionsOpen && (
                            <div className="absolute right-0 mt-1 w-48 rounded-md border border-border bg-ivory-light shadow-lg z-10">
                              {(r.status === "reading" ||
                                r.status === "paused") && (
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setAbandonTarget(r.id);
                                    setReadingActionsOpen(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-ink-deep hover:bg-paper transition-colors inline-flex items-center gap-2"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                  Abandonar
                                </button>
                              )}
                              {r.status === "finished" && (
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleStartReading(r.id);
                                    setReadingActionsOpen(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-ink-deep hover:bg-paper transition-colors"
                                >
                                  Reabrir leitura
                                </button>
                              )}
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setReadingModal({ open: true, reading: r });
                                  setReadingActionsOpen(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-ink-deep hover:bg-paper transition-colors inline-flex items-center gap-2"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                                Editar
                              </button>
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setDeleteReadingId(r.id);
                                  setReadingActionsOpen(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-burgundy hover:bg-burgundy/10 transition-colors border-t border-border inline-flex items-center gap-2"
                              >
                                <TrashIcon className="w-4 h-4" />
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Citações */}
      {quotes.length > 0 && (
        <Card className="mt-6 mb-6">
          <h2 className="font-display text-xl font-medium text-ink-deep mb-4 pb-3 border-b border-border">
            Citações
          </h2>
          <ul className="space-y-4">
            {quotes.map((q) => (
              <li key={q.id} className="group relative pr-16">
                <Link
                  href={`/quote/${q.slug}`}
                  className="block border-l-2 border-gold pl-4 py-1 text-ink-deep hover:bg-paper-soft/50 rounded-r-md transition-colors"
                >
                  <p className="text-lg italic font-display leading-relaxed">
                    {q.text}
                  </p>
                  <div className="mt-1 text-xs text-ink-fade italic flex flex-wrap gap-x-2">
                    {q.author_name && <span>— {q.author_name}</span>}
                    {q.chapter && <span>cap. {q.chapter}</span>}
                    {q.page && <span>p. {q.page}</span>}
                  </div>
                  {q.note && (
                    <p className="mt-2 text-xs text-ink-soft border-l-2 border-border pl-3 not-italic">
                      <span className="italic">{q.note}</span>
                    </p>
                  )}
                </Link>
                <div className="absolute top-0 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setQuoteModal({ open: true, quote: q })}
                    aria-label="Editar citação"
                    className="p-1.5 rounded text-ink-soft hover:text-ink-deep hover:bg-paper transition-colors"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteQuoteId(q.id)}
                    aria-label="Excluir citação"
                    className="p-1.5 rounded text-burgundy hover:bg-burgundy/10 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* (Card "Histórico" foi consolidado no card "Posse" — sessão 17.2.
          Timeline vertical aparece à direita do estado atual.) */}

      {/* Modais */}
      <ReadingFormModal
        open={readingModal.open}
        onClose={() => setReadingModal({ open: false, reading: null })}
        bookId={book.id}
        bookSlug={book.slug}
        reading={readingModal.reading}
      />
      <QuoteFormModal
        open={quoteModal.open}
        onClose={() => setQuoteModal({ open: false, quote: null })}
        bookId={book.id}
        bookSlug={book.slug}
        quote={quoteModal.quote}
      />
      <DisposeBookModal
        open={disposeOpen}
        onClose={() => setDisposeOpen(false)}
        bookId={book.id}
        bookSlug={book.slug}
      />

      <PauseReadingModal
        open={pauseTarget !== null}
        onClose={() => setPauseTarget(null)}
        readingId={pauseTarget ?? ""}
        bookSlug={book.slug}
      />
      <ResumeReadingModal
        open={resumeTarget !== null}
        onClose={() => setResumeTarget(null)}
        readingId={resumeTarget ?? ""}
        bookSlug={book.slug}
      />
      <FinishReadingModal
        open={finishTarget !== null}
        onClose={() => setFinishTarget(null)}
        readingId={finishTarget ?? ""}
        bookSlug={book.slug}
      />
      <AbandonReadingModal
        open={abandonTarget !== null}
        onClose={() => setAbandonTarget(null)}
        readingId={abandonTarget ?? ""}
        bookSlug={book.slug}
      />

      <ConfirmDialog
        open={deleteBookOpen}
        onClose={() => {
          setDeleteBookOpen(false);
          setActionError(null);
        }}
        onConfirm={handleDeleteBook}
        title="Excluir livro?"
        description={
          actionError
            ? actionError
            : `"${book.title}" será removido. Todas as leituras, citações e relações associadas também serão removidas. Esta ação não pode ser desfeita.`
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={pendingAction}
      />
      <ConfirmDialog
        open={deleteReadingId !== null}
        onClose={() => {
          setDeleteReadingId(null);
          setActionError(null);
        }}
        onConfirm={() => {
          if (deleteReadingId) handleDeleteReading(deleteReadingId);
        }}
        title="Excluir leitura?"
        description={actionError ?? "Esta ação não pode ser desfeita."}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={pendingAction}
      />
      <ConfirmDialog
        open={deleteQuoteId !== null}
        onClose={() => {
          setDeleteQuoteId(null);
          setActionError(null);
        }}
        onConfirm={() => {
          if (deleteQuoteId) handleDeleteQuote(deleteQuoteId);
        }}
        title="Excluir citação?"
        description={actionError ?? "Esta ação não pode ser desfeita."}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={pendingAction}
      />
    </div>
  );
}
