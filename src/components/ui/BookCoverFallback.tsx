import clsx from "clsx";

export type BookCoverFallbackSize = "sm" | "md" | "lg";

const sizeClasses: Record<BookCoverFallbackSize, string> = {
  sm: "w-16 text-3xl",
  md: "w-32 text-6xl",
  lg: "w-48 text-8xl",
};

// Rotação de 5 cores. Terracota é mais clara → inicial em ivory-light pra
// preservar contraste; as outras quatro são escuras → inicial em gold.
const COVER_COLORS: { bg: string; text: string }[] = [
  { bg: "bg-cappuccino", text: "text-gold" },
  { bg: "bg-moss", text: "text-gold" },
  { bg: "bg-burgundy", text: "text-gold" },
  { bg: "bg-navy", text: "text-gold" },
  { bg: "bg-terracota", text: "text-ivory-light" },
];

function pickIndex(title: string): number {
  if (!title) return 0;
  return (title.charCodeAt(0) || 0) % COVER_COLORS.length;
}

export type BookCoverFallbackProps = {
  title: string;
  size?: BookCoverFallbackSize;
  className?: string;
};

export default function BookCoverFallback({
  title,
  size = "md",
  className,
}: BookCoverFallbackProps) {
  const letter = (title?.trim()?.[0] ?? "?").toUpperCase();
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
      <span
        className={clsx(
          "font-display italic font-medium leading-none",
          text,
        )}
      >
        {letter}
      </span>
    </div>
  );
}
