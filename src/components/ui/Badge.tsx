import clsx from "clsx";
import type { HTMLAttributes } from "react";

export type BadgeVariant =
  | "gold"
  | "moss"
  | "olive"
  | "burgundy"
  | "navy"
  | "terracota"
  | "cappuccino"
  | "fade";

export type BadgeSize = "sm" | "md";

// Cada variant: bg da cor com baixa opacidade, texto na cor escurecida,
// border da cor com 35% de opacidade. `cappuccino` adicionado na 17.3 pra
// chips de formato físico, badges neutras quentes.
const variantClasses: Record<BadgeVariant, string> = {
  gold: "bg-gold/[0.18] text-gold-deep border-gold/35",
  moss: "bg-moss/[0.18] text-moss border-moss/35",
  olive: "bg-olive/[0.18] text-olive border-olive/35",
  burgundy: "bg-burgundy/[0.18] text-burgundy border-burgundy/35",
  navy: "bg-navy/[0.18] text-navy border-navy/35",
  terracota: "bg-terracota/[0.18] text-terracota border-terracota/35",
  cappuccino: "bg-cappuccino/[0.15] text-cappuccino border-cappuccino/35",
  fade: "bg-ink-fade/[0.18] text-ink-soft border-ink-fade/35",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-3 py-1 text-xs",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
};

export default function Badge({
  variant = "fade",
  size = "md",
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      {...rest}
      className={clsx(
        "inline-flex items-center rounded-full border font-body font-medium tracking-wide whitespace-nowrap",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      style={{ borderWidth: "0.5px", ...(rest.style ?? {}) }}
    >
      {children}
    </span>
  );
}
