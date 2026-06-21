"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolidIcon,
  StarIcon as StarSolidIcon,
} from "@heroicons/react/24/solid";
import { BookCoverFallback, RatingStars, StatusBadge } from "@/components/ui";
import { ShelfBackgroundDecoration } from "./ShelfBackgroundDecoration";
import {
  PageOrnamentBottomLeft,
  PageOrnamentBottomRight,
  PageOrnamentTopLeft,
  PageOrnamentTopRight,
} from "./PageOrnaments";
import { formatDate } from "@/utils/formatDate";
import { labelForOwnershipStatus } from "@/utils/labels";
import type { LegacyReadingStatus } from "@/components/ui/StatusBadge";
import type { Database } from "@/utils/typings/supabase";

type ReadingEventType = Database["public"]["Enums"]["reading_event_type"];
type ReadingStatus = Database["public"]["Enums"]["reading_status"];
type OwnershipStatus = Database["public"]["Enums"]["ownership_status"];

// =============================================================================
// Tipos públicos do view
// =============================================================================

export type BookForOpenView = {
  id: string;
  slug: string;
  title: string;
  original_title: string | null;
  cover_url: string | null;
  publisher: string | null;
  publication_year: number | null;
  pages: number | null;
  language: Database["public"]["Enums"]["book_language"] | null;
  synopsis: string | null;
  is_favorite: boolean;
  wont_read: boolean;
  ownership_status: OwnershipStatus;
  authors: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  serie: { name: string; slug: string; volume: number | null } | null;
  readings: {
    id: string;
    status: ReadingStatus;
    start_date: string | null;
    finish_date: string | null;
    rating: number | null;
    review: string | null;
    events: { event_type: ReadingEventType; event_date: string }[];
  }[];
  quotes: {
    id: string;
    slug: string;
    text: string;
    page: number | null;
  }[];
  collections: { id: string; slug: string; name: string }[];
};

// =============================================================================
// Helpers
// =============================================================================

const LANGUAGE_LABELS: Record<
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

const EVENT_LABELS: Record<ReadingEventType, string> = {
  started: "Começou",
  paused: "Pausou",
  resumed: "Voltou",
  finished: "Terminou",
  abandoned: "Abandonou",
};

function splitInHalf(text: string): { left: string; right: string } {
  // Quebra no espaço mais próximo do meio pra não cortar palavras.
  const mid = Math.floor(text.length / 2);
  const after = text.indexOf(" ", mid);
  const before = text.lastIndexOf(" ", mid);
  const cut =
    after === -1 ? before : Math.abs(after - mid) < Math.abs(mid - before) ? after : before;
  if (cut <= 0) return { left: text, right: "" };
  return { left: text.slice(0, cut).trim(), right: text.slice(cut).trim() };
}

// =============================================================================
// Página individual (par esquerda+direita)
// =============================================================================

type PageContent = { left: React.ReactNode; right: React.ReactNode };

function buildPages(
  book: BookForOpenView,
  useVintageCover: boolean,
): PageContent[] {
  const pages: PageContent[] = [];

  // 1. Capa + Ficha
  pages.push({
    left: <PageCover book={book} useVintageCover={useVintageCover} />,
    right: <PageFicha book={book} />,
  });

  // 2. Sinopse (só se houver — split em 2 colunas se grande)
  if (book.synopsis && book.synopsis.trim().length > 0) {
    const { left, right } = splitInHalf(book.synopsis);
    pages.push({
      left: <PageSynopsis title="Sinopse" body={left || book.synopsis} />,
      right: right ? (
        <PageSynopsis title="" body={right} />
      ) : (
        <PageEmpty hint="(continua na próxima página…)" />
      ),
    });
  }

  // 3. Avaliação + Status físico
  pages.push({
    left: <PageRating book={book} />,
    right: <PagePhysicalStatus book={book} />,
  });

  // 4. Histórico — só se há leituras
  if (book.readings.length > 0) {
    pages.push({
      left: <PageReadingDates book={book} />,
      right: <PageReadingTimeline book={book} />,
    });
  }

  // 5. Notas / Review — só se houver alguma review
  const reviewedReading = book.readings.find(
    (r) => r.review && r.review.trim().length > 0,
  );
  if (reviewedReading) {
    pages.push({
      left: <PageNotesLeft book={book} review={reviewedReading.review!} />,
      right: <PageNotesRight review={reviewedReading.review!} />,
    });
  }

  // 6. Citações
  if (book.quotes.length > 0) {
    const half = Math.ceil(book.quotes.length / 2);
    pages.push({
      left: <PageQuotes title="Citações" quotes={book.quotes.slice(0, half)} />,
      right:
        book.quotes.length > half ? (
          <PageQuotes title="" quotes={book.quotes.slice(half)} />
        ) : (
          <PageEmpty hint="" />
        ),
    });
  }

  // 7. Coleções
  if (book.collections.length > 0) {
    const half = Math.ceil(book.collections.length / 2);
    pages.push({
      left: (
        <PageCollections
          title="Coleções"
          collections={book.collections.slice(0, half)}
        />
      ),
      right:
        book.collections.length > half ? (
          <PageCollections title="" collections={book.collections.slice(half)} />
        ) : (
          <PageEmpty hint="" />
        ),
    });
  }

  return pages;
}

// =============================================================================
// Componente principal
// =============================================================================

type Props = {
  book: BookForOpenView;
  /** Sessão 17.5: quando o componente é usado dentro de um overlay
   *  state-driven (LibraryWall), o pai controla o fechamento. Sem isso,
   *  fallback pra router.back() (rota deep-link tradicional). */
  onClose?: () => void;
  /** Sessão 17.7: troca a capa real por VintageCover (cor + título). Usado
   *  quando o componente roda dentro do contexto da `/library`. */
  useVintageCover?: boolean;
  /** Sessão 17.7.5: marca uso dentro de um overlay state-driven (LibraryWall).
   *  Implica:
   *   - sem entrance animation (overlay já anima)
   *   - bg/decoração da library skipados (overlay deixa a parede dimmed por trás)
   *   - container raiz transparente
   */
  embedded?: boolean;
};

export function BookOpenView({
  book,
  onClose,
  useVintageCover = false,
  embedded = false,
}: Props) {
  const router = useRouter();
  const [pageIdx, setPageIdx] = useState(0);
  // Sessão 17.11: virada de PÁGINA (não do livro inteiro). Quando user
  // navega, salva qual era o pageIdx anterior + direção, e renderiza um
  // overlay animado (FlippingPage) por cima do spread base. O spread base
  // já mostra o conteúdo NOVO; o overlay simula a folha virando da posição
  // antiga pra nova. Limpo quando a animação termina.
  const [flip, setFlip] = useState<{
    oldIdx: number;
    direction: 1 | -1;
  } | null>(null);

  const pages = useMemo(
    () => buildPages(book, useVintageCover),
    [book, useVintageCover],
  );
  const totalPages = pages.length;

  const goNext = () => {
    if (pageIdx >= totalPages - 1 || flip) return;
    setFlip({ oldIdx: pageIdx, direction: 1 });
    setPageIdx((p) => p + 1);
  };
  const goPrev = () => {
    if (pageIdx <= 0 || flip) return;
    setFlip({ oldIdx: pageIdx, direction: -1 });
    setPageIdx((p) => p - 1);
  };
  const close = () => {
    if (onClose) {
      onClose();
      return;
    }
    if (
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      document.referrer.includes(window.location.host)
    ) {
      router.back();
    } else {
      router.push("/library");
    }
  };

  // Atalhos de teclado: ←, →, Esc.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIdx, totalPages]);

  // Em modo embedded, NÃO usamos min-h-screen pra que o componente se
  // dimensione pelo conteúdo — assim o flex parent (no overlay) pode
  // centralizá-lo verticalmente, casando posição com o livro 3D.
const rootClass = embedded
  ? "relative overflow-hidden"
  : "min-h-screen relative overflow-hidden";

  return (
    <div className={rootClass}>
      {!embedded && <ShelfBackgroundDecoration />}

      <button
        type="button"
        onClick={close}
        className="fixed top-4 right-4 z-50 px-4 py-2 text-sm border border-gold/30 hover:border-roasted-chestnut rounded-md transition-colors flex items-center gap-1.5"
        style={{ color: "rgba(245, 232, 208, 0.9)" }}
      >
        <XMarkIcon className="w-4 h-4" />
        Fechar
      </button>

<div className="container mx-auto py-6 sm:py-12 max-w-7xl relative z-10 px-4 sm:px-4">
        <BookOpenAnimation skip={embedded}>
          {/* Sessão 17.11: spread base SEM rotação — o livro inteiro nunca
              vira. A virada acontece só na <FlippingPage> overlay por cima
              da metade que está sendo virada. */}
          <div
            className="relative"
            style={{ perspective: 2400 }}
          >
            <BookPageSpread
              pageContent={pages[pageIdx]}
              pageNumber={pageIdx + 1}
              totalPages={totalPages}
            />
            <AnimatePresence>
              {flip && (
                <FlippingPage
                  key={`flip-${flip.oldIdx}-${pageIdx}`}
                  direction={flip.direction}
                  oldContent={pages[flip.oldIdx]}
                  newContent={pages[pageIdx]}
                  onComplete={() => setFlip(null)}
                />
              )}
            </AnimatePresence>
          </div>
        </BookOpenAnimation>

        <PageNavigation
          currentPage={pageIdx}
          totalPages={totalPages}
          onPrev={goPrev}
          onNext={goNext}
        />
      </div>
    </div>
  );
}

/**
 * Sessão 17.11: overlay animado que simula UMA folha virando — não o livro.
 *
 * Desktop: spread renderizado em duas colunas (grid-cols-2). A FlippingPage
 * cobre METADE do spread e rotaciona no eixo Y em torno da lombada — virando
 * a página da direita pra esquerda (forward) ou vice-versa (backward).
 *
 * Mobile: spread fica single-column (grid-cols-1) com as duas páginas
 * EMPILHADAS verticalmente. Aí a metáfora horizontal não cola — fazer a
 * folha de baixo cair pra esquerda enquanto está embaixo da de cima seria
 * confuso. Por isso o mobile usa flip VERTICAL (rotateX): forward "vira a
 * página pra cima" (origin top, rotação -180° em X), backward inverso.
 * A folha cobre o spread inteiro e mostra as duas páginas (left+right)
 * empilhadas em cada face.
 */
function FlippingPage({
  direction,
  oldContent,
  newContent,
  onComplete,
}: {
  direction: 1 | -1;
  oldContent: PageContent;
  newContent: PageContent;
  onComplete: () => void;
}) {
  // Detecção sincrona via matchMedia: como o componente é remontado a cada
  // flip (via AnimatePresence), o lazy init do useState garante a leitura
  // correta no primeiro render — sem flicker entre orientações.
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const cb = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, []);

  if (isMobile) {
    return (
      <FlippingPageVertical
        direction={direction}
        oldContent={oldContent}
        newContent={newContent}
        onComplete={onComplete}
      />
    );
  }

  const isForward = direction === 1;
  // Forward: vira a página DIREITA (front=old.right) que cai à esquerda
  // (back=new.left). Backward: vira a página ESQUERDA (front=old.left)
  // que cai à direita (back=new.right).
  const frontSide: "left" | "right" = isForward ? "right" : "left";
  const backSide: "left" | "right" = isForward ? "left" : "right";
  const frontContent = isForward ? oldContent.right : oldContent.left;
  const backContent = isForward ? newContent.left : newContent.right;

  return (
    <motion.div
      initial={{ rotateY: 0 }}
      animate={{
        rotateY: isForward ? -180 : 180,
        boxShadow: [
          "0 0 0 rgba(0,0,0,0)",
          "-12px 0 24px rgba(0,0,0,0.35)",
          "0 0 32px rgba(0,0,0,0.45)",
          "12px 0 24px rgba(0,0,0,0.35)",
          "0 0 0 rgba(0,0,0,0)",
        ],
      }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.85,
        ease: [0.22, 0.61, 0.36, 1],
        boxShadow: { times: [0, 0.25, 0.5, 0.75, 1] },
      }}
      onAnimationComplete={(def) => {
        // Só limpa quando a animação principal de rotação termina, não no exit
        if (typeof def === "object" && def !== null && "rotateY" in def) {
          onComplete();
        }
      }}
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        width: "50%",
        [isForward ? "right" : "left"]: 0,
        transformStyle: "preserve-3d",
        transformOrigin: isForward ? "left center" : "right center",
        zIndex: 5,
        pointerEvents: "none",
      }}
    >
      {/* Front: página antiga, visível 0–90° */}
      <div
        className={`absolute inset-0 px-12 py-14 md:px-16 book-page page-${frontSide}`}
        style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
      >
        {frontSide === "left" ? (
          <>
            <PageOrnamentTopLeft />
            <PageOrnamentBottomLeft />
          </>
        ) : (
          <>
            <PageOrnamentTopRight />
            <PageOrnamentBottomRight />
          </>
        )}
        {frontContent}
      </div>
      {/* Back: página nova, pré-rotacionada 180° pra cair correta no final */}
      <div
        className={`absolute inset-0 px-12 py-14 md:px-16 book-page page-${backSide}`}
        style={{
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
        }}
      >
        {backSide === "left" ? (
          <>
            <PageOrnamentTopLeft />
            <PageOrnamentBottomLeft />
          </>
        ) : (
          <>
            <PageOrnamentTopRight />
            <PageOrnamentBottomRight />
          </>
        )}
        {backContent}
      </div>
    </motion.div>
  );
}

/**
 * Variante mobile: rotateX em vez de rotateY, cobrindo o spread inteiro
 * (grid-cols-1). Cada face mostra `left` + `right` do `PageContent`
 * empilhados verticalmente, espelhando o layout estático do
 * `BookPageSpread` no mobile.
 *
 * Forward: hinge no topo, rotação -180° em X — a folha desce/cai pra cima,
 * revelando o conteúdo novo por trás. Backward: hinge embaixo, +180°.
 */
function FlippingPageVertical({
  direction,
  oldContent,
  newContent,
  onComplete,
}: {
  direction: 1 | -1;
  oldContent: PageContent;
  newContent: PageContent;
  onComplete: () => void;
}) {
  const isForward = direction === 1;
  const rotateXEnd = isForward ? -180 : 180;
  const origin = isForward ? "center top" : "center bottom";

  // Sombra acompanha a inclinação: começa do lado oposto ao hinge (a face
  // descolando da superfície), passa por brilho central (perpendicular) e
  // termina no lado oposto (face nova caindo no lugar). Inverte conforme
  // a direção pra a sensação física casar.
  const shadowSequence = isForward
    ? [
        "0 0 0 rgba(0,0,0,0)",
        "0 12px 24px rgba(0,0,0,0.35)",
        "0 0 32px rgba(0,0,0,0.45)",
        "0 -12px 24px rgba(0,0,0,0.35)",
        "0 0 0 rgba(0,0,0,0)",
      ]
    : [
        "0 0 0 rgba(0,0,0,0)",
        "0 -12px 24px rgba(0,0,0,0.35)",
        "0 0 32px rgba(0,0,0,0.45)",
        "0 12px 24px rgba(0,0,0,0.35)",
        "0 0 0 rgba(0,0,0,0)",
      ];

  return (
    <motion.div
      initial={{ rotateX: 0 }}
      animate={{
        rotateX: rotateXEnd,
        boxShadow: shadowSequence,
      }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.85,
        ease: [0.22, 0.61, 0.36, 1],
        boxShadow: { times: [0, 0.25, 0.5, 0.75, 1] },
      }}
      onAnimationComplete={(def) => {
        if (typeof def === "object" && def !== null && "rotateX" in def) {
          onComplete();
        }
      }}
      style={{
        position: "absolute",
        inset: 0,
        transformStyle: "preserve-3d",
        transformOrigin: origin,
        zIndex: 5,
        pointerEvents: "none",
      }}
    >
      {/* Front: spread antigo (left no topo, right embaixo) */}
      <div
        className="absolute inset-0 grid grid-cols-1"
        style={{
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        <div className="relative px-6 py-8 book-page page-left">
          <PageOrnamentTopLeft />
          <PageOrnamentBottomLeft />
          {oldContent.left}
        </div>
        <div className="relative px-6 py-8 book-page page-right">
          <PageOrnamentTopRight />
          <PageOrnamentBottomRight />
          {oldContent.right}
        </div>
      </div>
      {/* Back: spread novo, pré-rotacionado 180° em X pra cair correto no final */}
      <div
        className="absolute inset-0 grid grid-cols-1"
        style={{
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transform: "rotateX(180deg)",
        }}
      >
        <div className="relative px-6 py-8 book-page page-left">
          <PageOrnamentTopLeft />
          <PageOrnamentBottomLeft />
          {newContent.left}
        </div>
        <div className="relative px-6 py-8 book-page page-right">
          <PageOrnamentTopRight />
          <PageOrnamentBottomRight />
          {newContent.right}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Animação de entrada do livro. Sessão 17.7: pulada quando consumido pelo
 * `<BookOpenOverlay>`, que já anima o wrapper externamente — evita dupla
 * animação ("volta e sai de novo" reportado pelo user).
 */
function BookOpenAnimation({
  children,
  skip,
}: {
  children: React.ReactNode;
  skip: boolean;
}) {
  if (skip) {
    return (
      <div style={{ transformStyle: "preserve-3d", perspective: 1400 }}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      initial={{ scale: 0.7, rotateX: -18, opacity: 0 }}
      animate={{ scale: 1, rotateX: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.34, 1.4, 0.64, 1] }}
      style={{ transformStyle: "preserve-3d", perspective: 1400 }}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// Spread (duas páginas lado a lado)
// =============================================================================

function BookPageSpread({
  pageContent,
  pageNumber,
  totalPages,
}: {
  pageContent: PageContent;
  pageNumber: number;
  totalPages: number;
}) {
  return (
    <div
      className="book-spread relative grid grid-cols-1 md:grid-cols-2 overflow-hidden min-h-[440px] sm:min-h-[620px]"
      style={{
        borderRadius: 6,
        background:
          "linear-gradient(90deg, #8a5b2c 0%, #b8834a 2%, #d7b07a 4%, #f1dfbf 10%, #f4e6ca 50%, #f1dfbf 90%, #d7b07a 96%, #8a5b2c 100%)",
        boxShadow:
          "0 35px 80px rgba(0,0,0,0.75), inset 0 0 60px rgba(60,30,10,0.18), inset 0 0 120px rgba(0,0,0,0.08)",
        border: "1px solid rgba(92,52,20,0.65)",
      }}
    >
      <span aria-hidden className="book-binding hidden md:block" />

      <div className="relative px-6 py-8 sm:px-12 sm:py-14 md:px-16 book-page page-left">
        <PageOrnamentTopLeft />
        <PageOrnamentBottomLeft />
        {pageContent.left}
      </div>

      <div className="relative px-6 py-8 sm:px-12 sm:py-14 md:px-16 book-page page-right">
        <PageOrnamentTopRight />
        <PageOrnamentBottomRight />
        {pageContent.right}

        <span className="absolute bottom-4 right-5 text-[10px] italic text-[#6f4c31]/70">
          {pageNumber} / {totalPages}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Navegação (setas + dots)
// =============================================================================

function PageNavigation({
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex justify-between items-center mt-6 px-2 gap-3">
      <button
        type="button"
        onClick={onPrev}
        disabled={currentPage === 0}
        className="text-sm disabled:opacity-30 hover:text-gold transition-colors flex items-center gap-1.5"
        style={{ color: "rgba(245, 232, 208, 0.9)" }}
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Anterior
      </button>

      <div
        className="flex gap-1.5 items-center"
        role="tablist"
        aria-label="Páginas"
      >
        {Array.from({ length: totalPages }).map((_, i) => (
          <span
            key={i}
            aria-current={i === currentPage ? "page" : undefined}
            className={`rounded-full transition-all ${
              i === currentPage
                ? "bg-gold w-3 h-3"
                : "bg-paper-aged/30 w-1.5 h-1.5"
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={currentPage === totalPages - 1}
        className="text-sm disabled:opacity-30 hover:text-gold transition-colors flex items-center gap-1.5"
        style={{ color: "rgba(245, 232, 208, 0.9)" }}
      >
        Próxima
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

// =============================================================================
// Conteúdo das páginas
// =============================================================================

function PageHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[28px] tracking-[0.08em] font-medium mb-5 text-[#4a2b16]">
      {children}
    </h2>
  );
}

function PageEmpty({ hint }: { hint: string }) {
  return (
    <p className="text-xs italic text-ink-fade/50 text-center mt-12">
      {hint}
    </p>
  );
}

function PageCover({
  book,
  useVintageCover,
}: {
  book: BookForOpenView;
  useVintageCover: boolean;
}) {
  // Sessão 17.7.5: no contexto da `/library`, a página esquerda do Spread 1
  // vira "frontispício" — só o título grande ocupando ~80% da página, em
  // display italic. Sem retângulo VintageCover, sem capa real, sem título
  // repetido embaixo. Original_title fica como subtítulo discreto.
  if (useVintageCover) {
    return (
      <div className="book-page-title">
        <h1 className="book-title-large">{book.title}</h1>
        {book.original_title && (
          <p className="book-subtitle">{book.original_title}</p>
        )}
      </div>
    );
  }

  // Standalone (não-library): mantém capa real + título embaixo (comportamento
  // pré-17.7).
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div
        className="relative shadow-2xl rounded-sm overflow-hidden border border-ink-deep/30"
        style={{ width: 180, height: 270, aspectRatio: "2 / 3" }}
      >
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={`Capa de ${book.title}`}
            fill
            className="object-cover"
            sizes="180px"
            priority
          />
        ) : (
          <BookCoverFallback
            title={book.title}
            size="lg"
            className="w-full h-full"
          />
        )}
      </div>
      <p className="mt-6 font-display text-2xl text-center text-[#4b3725] leading-tight">
        {book.title}
      </p>
      {book.original_title && (
        <p className="mt-1 text-xs italic text-ink-fade text-center">
          {book.original_title}
        </p>
      )}
    </div>
  );
}

function PageFicha({ book }: { book: BookForOpenView }) {
  return (
    <div>
      <PageHeading>Ficha técnica</PageHeading>
      <dl className="space-y-2.5 text-sm text-[#4b3725]">
        {book.authors.length > 0 && (
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-ink-fade">
              {book.authors.length === 1 ? "Autor" : "Autores"}
            </dt>
            <dd className="font-display">
              {book.authors.map((a) => a.name).join(", ")}
            </dd>
          </div>
        )}
        {book.serie && (
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-ink-fade">
              Série
            </dt>
            <dd>
              <Link
                href={`/serie/${book.serie.slug}`}
                className="text-gold-deep hover:text-[#4b3725] underline transition-colors"
              >
                {book.serie.name}
              </Link>
              {book.serie.volume !== null && (
                <span className="text-ink-fade italic">
                  {" "}· vol. {book.serie.volume}
                </span>
              )}
            </dd>
          </div>
        )}
        {book.publisher && (
          <Field label="Editora" value={book.publisher} />
        )}
        {book.publication_year && (
          <Field
            label="Ano"
            value={String(book.publication_year)}
          />
        )}
        {book.pages && <Field label="Páginas" value={String(book.pages)} />}
        {book.language && (
          <Field label="Idioma" value={LANGUAGE_LABELS[book.language]} />
        )}
        {book.categories.length > 0 && (
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-ink-fade">
              Categorias
            </dt>
            <dd className="flex flex-wrap gap-1.5 mt-1">
              {book.categories.map((c) => (
                <span
                  key={c.id}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-ink-fade/30 text-ink-soft italic"
                >
                  {c.name}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-ink-fade">
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

function PageSynopsis({ title, body }: { title: string; body: string }) {
  return (
    <div>
      {title && <PageHeading>{title}</PageHeading>}
      <p className="font-body text-sm text-[#4b3725] leading-relaxed whitespace-pre-line">
        {body}
      </p>
    </div>
  );
}

function PageRating({ book }: { book: BookForOpenView }) {
  // Pega rating mais alto entre as readings (releitura pode ter outra nota).
  const rating = book.readings.reduce<number | null>((acc, r) => {
    if (typeof r.rating !== "number") return acc;
    if (acc === null || r.rating > acc) return r.rating;
    return acc;
  }, null);

  return (
    <div>
      <PageHeading>Avaliação</PageHeading>
      <div className="flex items-center gap-1 mb-3">
        <RatingStars value={rating} size="text-3xl" />
        {rating === null && (
          <span className="text-xs italic text-ink-fade ml-2">sem nota</span>
        )}
      </div>
      {book.is_favorite && (
        <p className="flex items-center gap-2 text-sm text-burgundy mt-2">
          <HeartSolidIcon className="w-4 h-4" />
          <span className="italic">Marcado como favorito</span>
        </p>
      )}
    </div>
  );
}

function PagePhysicalStatus({ book }: { book: BookForOpenView }) {
  // Status de leitura: pega o da reading mais recente.
  const latest = book.readings[0];
  const readingStatus: LegacyReadingStatus =
    (latest?.status as LegacyReadingStatus | null) ??
    (book.wont_read ? "wont_read" : "tbr");

  return (
    <div>
      <PageHeading>Status</PageHeading>
      <div className="space-y-3 text-sm text-[#4b3725]">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-ink-fade mb-1.5">
            Acervo
          </p>
          <p className="font-display text-base">
            {labelForOwnershipStatus(book.ownership_status)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-ink-fade mb-1.5">
            Status de leitura
          </p>
          <StatusBadge kind="reading" status={readingStatus} size="md" />
        </div>
      </div>
    </div>
  );
}

function PageReadingDates({ book }: { book: BookForOpenView }) {
  const latest = book.readings[0];
  return (
    <div>
      <PageHeading>Histórico</PageHeading>
      <dl className="space-y-2.5 text-sm text-[#4b3725]">
        {latest?.start_date && (
          <Field
            label="Começou em"
            value={formatDate(latest.start_date) ?? "—"}
          />
        )}
        {latest?.finish_date && (
          <Field
            label="Terminou em"
            value={formatDate(latest.finish_date) ?? "—"}
          />
        )}
        {book.readings.length > 1 && (
          <Field
            label="Releituras"
            value={`${book.readings.length} leituras registradas`}
          />
        )}
      </dl>
    </div>
  );
}

function PageReadingTimeline({ book }: { book: BookForOpenView }) {
  // Agrega events de todas as readings ordenados por data.
  const all = book.readings.flatMap((r) => r.events);
  all.sort((a, b) => a.event_date.localeCompare(b.event_date));

  if (all.length === 0) {
    return (
      <div>
        <PageHeading>Eventos</PageHeading>
        <p className="text-xs italic text-ink-fade">Sem eventos registrados.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeading>Eventos</PageHeading>
      <ul className="space-y-2 text-sm text-[#4b3725]">
        {all.map((e, i) => (
          <li key={i} className="flex gap-3 items-baseline">
            <span className="font-display text-gold-deep w-12 text-xs">
              {EVENT_LABELS[e.event_type]}
            </span>
            <span className="italic text-ink-fade text-xs">
              {formatDate(e.event_date) ?? e.event_date}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PageNotesLeft({
  book,
  review,
}: {
  book: BookForOpenView;
  review: string;
}) {
  const { left } = splitInHalf(review);
  return (
    <div>
      <PageHeading>Notas pessoais</PageHeading>
      <p className="text-[10px] uppercase tracking-wider text-ink-fade mb-2">
        Sobre {book.title}
      </p>
      <p className="font-body text-sm text-[#4b3725] leading-relaxed whitespace-pre-line italic">
        {left}
      </p>
    </div>
  );
}

function PageNotesRight({ review }: { review: string }) {
  const { right } = splitInHalf(review);
  return (
    <div>
      <p className="font-body text-sm text-[#4b3725] leading-relaxed whitespace-pre-line italic">
        {right || review}
      </p>
    </div>
  );
}

function PageQuotes({
  title,
  quotes,
}: {
  title: string;
  quotes: BookForOpenView["quotes"];
}) {
  return (
    <div>
      {title && <PageHeading>{title}</PageHeading>}
      <ul className="space-y-4">
        {quotes.map((q) => (
          <li key={q.id}>
            <Link
              href={`/quote/${q.slug}`}
              className="block text-sm italic text-[#4b3725] leading-relaxed hover:text-gold-deep transition-colors"
            >
              <span className="font-display text-base text-gold-deep mr-1">
                “
              </span>
              {q.text.length > 220 ? `${q.text.slice(0, 220)}…` : q.text}
              {q.page && (
                <span className="not-italic text-[11px] text-ink-fade ml-1">
                  (p. {q.page})
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PageCollections({
  title,
  collections,
}: {
  title: string;
  collections: BookForOpenView["collections"];
}) {
  return (
    <div>
      {title && <PageHeading>{title}</PageHeading>}
      <ul className="space-y-2 text-sm text-[#4b3725]">
        {collections.map((c) => (
          <li key={c.id}>
            <Link
              href={`/collection/${c.slug}`}
              className="hover:text-gold-deep transition-colors"
            >
              · {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
