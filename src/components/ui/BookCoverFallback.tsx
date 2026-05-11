import clsx from "clsx";
import { BookOpenIcon } from "@heroicons/react/24/solid";

export type BookCoverFallbackSize = "sm" | "md" | "lg";

// `sm` mostra ícone de livro (BookOpen) em vez de texto — usado em listas
// densas (busca global, sidebars, modais) onde não cabe título. `md`/`lg`
// mostram o título cheio com tipografia de capa de livro (Cinzel + moldura).
const sizeClasses: Record<BookCoverFallbackSize, string> = {
  sm: "w-16",
  md: "w-32",
  lg: "w-48",
};

// Rotação de 5 cores. Terracota é mais clara → inicial em ivory-light pra
// preservar contraste; as outras quatro são escuras → inicial em gold.
// `hex` é exposto pra outros componentes (ex.: header da BookDetailPage)
// poderem casar o tom de fundo com a "cor de capa" do livro.
const COVER_COLORS: { bg: string; text: string; hex: string }[] = [
  { bg: "bg-cappuccino", text: "text-gold", hex: "#4D2F1C" },
  { bg: "bg-moss", text: "text-gold", hex: "#5C6E47" },
  { bg: "bg-burgundy", text: "text-gold", hex: "#82393A" },
  { bg: "bg-navy", text: "text-gold", hex: "#1E3A5F" },
  { bg: "bg-terracota", text: "text-ivory-light", hex: "#BC6E48" },
];

function pickIndex(title: string): number {
  if (!title) return 0;
  return (title.charCodeAt(0) || 0) % COVER_COLORS.length;
}

/** Cor "de capa" derivada do título — mesma usada no fallback. */
export function pickBookCoverColor(title: string): {
  bg: string;
  text: string;
  hex: string;
} {
  return COVER_COLORS[pickIndex(title)];
}

export type BookCoverFallbackProps = {
  title: string;
  size?: BookCoverFallbackSize;
  className?: string;
};

/** Escala o tamanho da fonte do título pela quantidade de caracteres pra
 *  caber bem em capas `md` (32 unidades) e `lg` (48 unidades). Cinzel
 *  uppercase ocupa mais espaço horizontal que uma italic — por isso os
 *  valores são mais comedidos que o que daria com Cormorant. Curva
 *  considera o padding interno `px-4` da moldura. */
function titleFontSizeRem(title: string, size: "md" | "lg"): string {
  const len = title.trim().length;
  if (size === "lg") {
    if (len <= 10) return "1.75rem";
    if (len <= 18) return "1.3rem";
    if (len <= 28) return "1rem";
    if (len <= 45) return "0.85rem";
    return "0.72rem";
  }
  // md
  if (len <= 10) return "1.05rem";
  if (len <= 18) return "0.85rem";
  if (len <= 28) return "0.72rem";
  return "0.65rem";
}

export default function BookCoverFallback({
  title,
  size = "md",
  className,
}: BookCoverFallbackProps) {
  const { bg, text } = COVER_COLORS[pickIndex(title)];

  return (
    <div
      role="img"
      aria-label={`Capa do livro ${title}`}
      className={clsx(
        "relative flex items-center justify-center rounded-md overflow-hidden",
        "shadow-sm border border-ink-deep/30",
        bg,
        sizeClasses[size],
        className,
      )}
      style={{ aspectRatio: "2 / 3" }}
    >
      {size === "sm" ? (
        // Tamanho pequeno (mini-thumbnails 22-50px em listas densas, busca
        // global, sidebars). Ícone de livro em dourado em vez de inicial —
        // mais legível e elegante em escala pequena que uma letra cramped.
        <BookOpenIcon
          aria-hidden
          className={clsx("w-1/2 h-1/2 opacity-80", text)}
        />
      ) : (
        // Tamanhos md/lg: título completo, tipografia de capa de livro.
        // Moldura interna fina dourada + ornamento simples acima/abaixo
        // dão sensação de capa "trabalhada" sem ilustração real.
        <div
          className={clsx(
            "absolute inset-2 flex flex-col items-center justify-center px-4 py-3",
            "border border-current/40 rounded-sm",
            text,
          )}
        >
          <span
            aria-hidden
            className="text-xs leading-none opacity-70 mb-2 tracking-[0.4em]"
          >
            ✦
          </span>
          <span
            className="font-cover font-normal text-center leading-[1.15] break-words tracking-[0.04em] uppercase"
            style={{ fontSize: titleFontSizeRem(title, size) }}
          >
            {title}
          </span>
          <span
            aria-hidden
            className="text-xs leading-none opacity-70 mt-2 tracking-[0.4em]"
          >
            ✦
          </span>
        </div>
      )}
    </div>
  );
}
