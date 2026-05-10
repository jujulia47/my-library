import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  iconColor?: string;
  children: ReactNode;
};

/**
 * Pequena label uppercase usada como divisor de seções na home (Lendo agora,
 * Resumo, etc.). O ícone é opcional; quando passado, herda cor de `iconColor`
 * (hex/var) via `style={{ color }}`.
 */
export function SectionLabel({ icon, iconColor, children }: Props) {
  return (
    <p className="text-xs uppercase tracking-wider text-ink-fade mb-2 mt-6 flex items-center gap-1.5">
      {icon && (
        <span
          aria-hidden
          className="inline-flex items-center"
          style={iconColor ? { color: iconColor } : undefined}
        >
          {icon}
        </span>
      )}
      {children}
    </p>
  );
}
