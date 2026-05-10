import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export type CardVariant = "default" | "surface";
export type CardSize = "sm" | "md" | "lg";

const variantClasses: Record<CardVariant, string> = {
  // Sombra sutil só no `default` — `surface` é tom mais escuro pra panels
  // (ex.: chips ativos, blocos secundários) e fica chapado.
  default:
    "bg-ivory-light border-border shadow-[0_1px_2px_rgba(74,56,38,0.05),0_4px_12px_rgba(74,56,38,0.06)]",
  surface: "bg-paper border-border",
};

const sizeClasses: Record<CardSize, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  size?: CardSize;
  header?: ReactNode;
  footer?: ReactNode;
};

export default function Card({
  variant = "default",
  size = "md",
  header,
  footer,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      {...rest}
      className={clsx(
        "rounded-lg border",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {header && (
        <div className="mb-4 pb-4 border-b border-border">{header}</div>
      )}
      <div>{children}</div>
      {footer && (
        <div className="mt-4 pt-4 border-t border-border">{footer}</div>
      )}
    </div>
  );
}
