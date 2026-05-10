"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  spineGradientForBookId,
  spineTextClassForBookId,
  spineWidthForPages,
} from "@/utils/spineColors";
import { useBookHover } from "./useBookHover";
import type { ShelfBook } from "@/services/libraryData";

// Sessão 17.4: novo modo "wall" pra parede de prateleiras horizontais.
//   - Width vem de `pages` (clamp 24-44px) via `spineWidthForPages`.
//   - Cor vem de hash(book.id) → 8 cores via `spineGradientForBookId`.
//   - Estilo vintage com frisos de couro, halo pra "lendo agora".
// Mantém modos antigos `mini` e `zoom` pra retrocompat (LibraryPanorama
// antigo + outros consumidores). Wall é o default novo.
type Mode = "mini" | "zoom" | "wall";

type Props = {
  book: ShelfBook;
  mode: Mode;
  /**
   * Quando true, registra `useDraggable` + dois `useDroppable` (left/right
   * pra indicador de inserção). Padrão: false (panorâmica `mini`).
   */
  draggable?: boolean;
  /**
   * Quando true, é a réplica fantasma renderizada no `<DragOverlay>`. Não
   * registra ouvintes nem droppables; opacidade total (sobreposta no cursor).
   */
  isDragOverlay?: boolean;
  /**
   * Destino do click. Defaults:
   *  - mini  → /book/{slug} (detail tradicional)
   *  - zoom  → /library/book/{slug} (vista "livro abrindo")
   */
  href?: string;
  /**
   * Sessão 17.5: callback opcional pra interceptar o click e abrir o overlay
   * de "livro abrindo" sem trocar de rota. Recebe o book e a `DOMRect` da
   * lombada (pra animar spine→cover saindo da posição original).
   * Quando passado, sobrescreve o navigation default. Quando undefined,
   * comportamento legacy (Link/router.push pro href).
   */
  onSpineClick?: (book: ShelfBook, rect: DOMRect) => void;
  /**
   * Quando true, click não abre o livro nem navega — útil em contextos onde
   * o usuário só quer reordenar/arrastar (ex.: vista zoom da prateleira).
   * Drag continua funcionando.
   */
  disableOpen?: boolean;
};

function darken(hex: string, percent: number): string {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  const factor = 1 - percent / 100;
  const r2 = Math.max(0, Math.round(r * factor));
  const g2 = Math.max(0, Math.round(g * factor));
  const b2 = Math.max(0, Math.round(b * factor));
  return `#${r2.toString(16).padStart(2, "0")}${g2.toString(16).padStart(2, "0")}${b2.toString(16).padStart(2, "0")}`;
}

export function BookSpine({
  book,
  mode,
  draggable = false,
  isDragOverlay = false,
  href,
  onSpineClick,
  disableOpen = false,
}: Props) {
  const isMini = mode === "mini";
  const isWall = mode === "wall";

  // Wall: width novo via pages, gradient via hash do id. Outros: comportamento
  // antigo (legado preservado).
  const width = isWall
    ? spineWidthForPages(book.pages)
    : isMini
      ? Math.max(8, Math.round(book.spine_width / 1.6))
      : book.spine_width;

  // Livro emprestado pra alguém (lent_out) renderiza esmaecido — está
  // fisicamente fora mas semanticamente ainda nosso.
  const opacity = book.ownership_status === "lent_out" ? 0.4 : 1;
  const titleFontSize = isMini ? 6 : 9;
  const showTitle = !isMini || width >= 11;
  const finalHref =
    href ?? (isMini ? `/book/${book.slug}` : `/library/book/${book.slug}`);

  const innerStyle: React.CSSProperties = {
    width,
    background: isWall
      ? spineGradientForBookId(book.id)
      : `linear-gradient(90deg, ${book.spine_color} 0%, ${darken(
          book.spine_color,
          30,
        )} 100%)`,
    opacity,
    paddingTop: isMini ? 2 : 4,
    paddingBottom: isMini ? 2 : 4,
  };

  // Sessão 17.4: wall mode usa CSS classes (.spine-friso, .spine-title) +
  // text class derivado da cor da lombada (texto claro em escura, escuro em
  // clara).
  const wallTextClass = isWall ? spineTextClassForBookId(book.id) : "";
  const isReadingActive = false; // TODO: precisa de info de reading ativa
  // (sessão futura — exige join com reading na ShelfBook).

  const innerNodes = isWall ? (
    <>
      <span aria-hidden className="spine-friso top" />
      <span aria-hidden className="spine-friso bottom" />
      {/* Sessão 17.10: ornamentos vintage nos painéis acima e abaixo das
          raised bands (estilo fleuron) — referenciam lombadas antigas com
          rosetas/fleurons douradas em cada painel separado por nervuras. */}
      <SpineOrnament position="top" />
      <SpineOrnament position="bottom" />
      <span className={`spine-title ${wallTextClass}`}>{book.title}</span>
      {book.volume !== null && (
        <span
          className="text-[8px] font-display rounded-sm px-1 leading-tight absolute bottom-1 left-1/2 -translate-x-1/2"
          style={{ background: "rgba(212,176,86,0.85)", color: "#3D2418" }}
        >
          {book.volume}
        </span>
      )}
      {isReadingActive && <span className="spine-halo" aria-hidden />}
    </>
  ) : (
    <>
      <span
        aria-hidden
        className="block w-[60%] h-[1px] rounded-full"
        style={{ background: "rgba(240,192,64,0.55)" }}
      />
      {showTitle && (
        <span
          className="vertical-text font-display text-paper-aged truncate"
          style={{
            fontSize: titleFontSize,
            maxHeight: "78%",
            opacity: 0.85,
            paddingLeft: 1,
            paddingRight: 1,
          }}
        >
          {book.title}
        </span>
      )}
      {!isMini && book.volume !== null && (
        <span
          className="text-[8px] font-display rounded-sm px-1 leading-tight"
          style={{ background: "rgba(240,192,64,0.85)", color: "#3D2418" }}
        >
          {book.volume}
        </span>
      )}
      <span
        aria-hidden
        className="block w-[60%] h-[1px] rounded-full"
        style={{ background: "rgba(240,192,64,0.55)" }}
      />
    </>
  );

  const titleAttr = `${book.title}${book.author_name ? ` — ${book.author_name}` : ""}${
    book.ownership_status === "lent_out" ? " (emprestado)" : ""
  }`;
  // Sessão 17.10: tooltip portal-based (fixed position) — funciona pra
  // todos os livros, contornando o overflow:hidden dos containers.
  const hoverLabel = isWall ? titleAttr : "";
  const { handlers: hoverHandlers, tooltip: hoverTooltip } =
    useBookHover(hoverLabel);

  // Wall mode usa classe `.book-spine` (CSS em globals.css) + height 100%
  // herdado do `.shelf-content` pai. Outros modos: comportamento antigo.
  const wallClassName =
    "book-spine relative h-full flex flex-col items-center justify-center";
  const legacyClassName =
    "relative h-full rounded-[1px] shadow-spine flex flex-col items-center justify-between overflow-hidden hover:-translate-y-[3px] transition-transform";
  const baseClassName = isWall ? wallClassName : legacyClassName;

  // Variante simples (não-draggable) — usada na panorâmica e no overlay.
  if (!draggable || isDragOverlay) {
    if (isDragOverlay) {
      return (
        <div
          title={titleAttr}
          className={`${
            isWall ? "book-spine" : "relative h-[120px] rounded-[1px] shadow-spine flex flex-col items-center justify-between overflow-hidden"
          } ring-2 ring-gold/70`}
          style={isWall ? { ...innerStyle, height: 160 } : innerStyle}
        >
          {innerNodes}
        </div>
      );
    }
    // Sessão 17.5: se onSpineClick é passado (overlay state-driven em
    // /library), interceptamos o click — captura DOMRect da lombada pra
    // animar spine→cover saindo da posição original.
    if (onSpineClick) {
      return (
        <button
          type="button"
          title={titleAttr}
          className={baseClassName}
          style={innerStyle}
          onClick={(e) => {
            const rect = (
              e.currentTarget as HTMLElement
            ).getBoundingClientRect();
            onSpineClick(book, rect);
          }}
          {...hoverHandlers}
        >
          {innerNodes}
          {hoverTooltip}
        </button>
      );
    }
    return (
      <Link
        href={finalHref}
        title={titleAttr}
        className={baseClassName}
        style={innerStyle}
        {...hoverHandlers}
      >
        {innerNodes}
        {hoverTooltip}
      </Link>
    );
  }

  return (
    <DraggableSpine
      book={book}
      finalHref={finalHref}
      titleAttr={titleAttr}
      hoverHandlers={hoverHandlers}
      hoverTooltip={hoverTooltip}
      innerStyle={innerStyle}
      isWall={isWall}
      onSpineClick={onSpineClick}
      disableOpen={disableOpen}
    >
      {innerNodes}
    </DraggableSpine>
  );
}

/**
 * Variante draggable — registra useDraggable + dois useDroppable em cada
 * metade pra indicador de inserção. Click navega via router.push (em vez de
 * <Link>) pra que o dnd-kit consiga distinguir click curto de drag via
 * `activationConstraint distance`.
 */
function DraggableSpine({
  book,
  finalHref,
  titleAttr,
  innerStyle,
  children,
  isWall = false,
  onSpineClick,
  disableOpen = false,
  hoverHandlers,
  hoverTooltip,
}: {
  book: ShelfBook;
  finalHref: string;
  titleAttr: string;
  innerStyle: React.CSSProperties;
  children: React.ReactNode;
  isWall?: boolean;
  onSpineClick?: (book: ShelfBook, rect: DOMRect) => void;
  disableOpen?: boolean;
  hoverHandlers?: {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
    onMouseMove: (e: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave: () => void;
  };
  hoverTooltip?: React.ReactNode;
}) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: book.id,
    data: { type: "book", book },
  });

  // Dois droppables — left/right halves — pra indicador de inserção.
  const { setNodeRef: setLeftRef, isOver: isOverLeft } = useDroppable({
    id: `${book.id}-left`,
    data: {
      type: "book-position",
      shelfId: book.shelf_id,
      position: book.shelf_position,
    },
  });
  const { setNodeRef: setRightRef, isOver: isOverRight } = useDroppable({
    id: `${book.id}-right`,
    data: {
      type: "book-position",
      shelfId: book.shelf_id,
      position: book.shelf_position + 1,
    },
  });

  const wallClasses =
    "book-spine relative h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none";
  const legacyClasses =
    "relative h-full rounded-[1px] shadow-spine flex flex-col items-center justify-between overflow-hidden cursor-grab active:cursor-grabbing hover:-translate-y-[3px] transition-transform touch-none";

  return (
    <div
      ref={setDragRef}
      {...listeners}
      {...attributes}
      {...(hoverHandlers ?? {})}
      title={titleAttr}
      className={isWall ? wallClasses : legacyClasses}
      style={{
        ...innerStyle,
        opacity: isDragging ? 0.3 : innerStyle.opacity,
      }}
      onClick={(e) => {
        if (isDragging) {
          e.preventDefault();
          return;
        }
        // disableOpen: contexto onde click NÃO deve abrir o livro nem
        // navegar (ex.: vista zoom da prateleira). Drag continua ativo.
        if (disableOpen) {
          e.preventDefault();
          return;
        }
        // Sessão 17.5: se onSpineClick é passado, abre overlay state-driven
        // (não troca de rota). Captura DOMRect pra animar saindo da posição.
        if (onSpineClick) {
          const rect = (
            e.currentTarget as HTMLElement
          ).getBoundingClientRect();
          onSpineClick(book, rect);
          return;
        }
        router.push(finalHref);
      }}
    >
      {children}
      {hoverTooltip}

      {/* Drop targets pra indicador. z-index alto pra sobrepor o conteúdo. */}
      <span
        ref={setLeftRef}
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1/2 z-10"
      >
        {isOverLeft && <DropIndicator side="left" />}
      </span>
      <span
        ref={setRightRef}
        aria-hidden
        className="absolute right-0 top-0 bottom-0 w-1/2 z-10"
      >
        {isOverRight && <DropIndicator side="right" />}
      </span>
    </div>
  );
}

function DropIndicator({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden
      className="absolute top-0 bottom-0 w-[3px] rounded-full bg-gold"
      style={{
        [side]: -3,
        boxShadow: "0 0 8px rgba(240,192,64,0.85)",
      }}
    />
  );
}

/**
 * Sessão 17.10: pequena fleuron horizontal usada como ornamento entre o
 * friso (próximo da borda) e a raised band (a ~22%) — análogo aos painéis
 * decorativos das lombadas antigas. SVG inline pra não inflar bundle CSS.
 */
function SpineOrnament({ position }: { position: "top" | "bottom" }) {
  return (
    <span aria-hidden className={`spine-ornament ${position}`}>
      <svg viewBox="0 0 24 8" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* Linha base */}
        <line x1="2" y1="4" x2="22" y2="4" stroke="rgba(212,176,86,0.5)" strokeWidth="0.4" />
        {/* Pétalas laterais */}
        <ellipse cx="6" cy="4" rx="2" ry="1.3" fill="rgba(212,176,86,0.85)" />
        <ellipse cx="18" cy="4" rx="2" ry="1.3" fill="rgba(212,176,86,0.85)" />
        {/* Centro (botão) */}
        <circle cx="12" cy="4" r="1.4" fill="#3D2418" />
        <circle cx="12" cy="4" r="0.85" fill="#A0843E" />
        <circle cx="12" cy="4" r="0.3" fill="#F0D080" />
        {/* Pontos decorativos pequenos */}
        <circle cx="3" cy="4" r="0.4" fill="rgba(212,176,86,0.7)" />
        <circle cx="21" cy="4" r="0.4" fill="rgba(212,176,86,0.7)" />
      </svg>
    </span>
  );
}
