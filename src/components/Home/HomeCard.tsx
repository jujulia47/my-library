import type { CSSProperties, ReactNode } from "react";

type Props = {
  title: string;
  icon?: ReactNode;
  iconColor?: string;
  children: ReactNode;
  className?: string;
  /** Estilo extra aplicado ao container (ex.: gradient de fundo). */
  style?: CSSProperties;
  /**
   * Quando passado, substitui as utilities padrão de superfície (`bg-paper
   * border-paper-soft`). Útil pra cards com fundo decorativo (ex.: DailyQuote
   * com gradient gold).
   */
  surfaceClassName?: string;
};

/**
 * Shell visual padrão dos cards de visualização da home. Header em uppercase
 * tracking-wider + ícone opcional colorido; corpo flexível ocupa o resto.
 */
export function HomeCard({
  title,
  icon,
  iconColor = "#EF9F27",
  children,
  className,
  style,
  surfaceClassName = "bg-paper border border-paper-soft",
}: Props) {
  return (
    <div
      className={`${surfaceClassName} rounded-lg p-4 flex flex-col${
        className ? ` ${className}` : ""
      }`}
      style={style}
    >
      <p className="text-xs uppercase tracking-wider text-ink-fade mb-3 flex items-center gap-1.5">
        {icon && (
          <span aria-hidden style={{ color: iconColor }}>
            {icon}
          </span>
        )}
        {title}
      </p>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function HomeCardEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs italic text-ink-fade text-center py-6">{children}</p>
  );
}
