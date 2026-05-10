"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type HoverPos = { x: number; y: number };

/**
 * Hook do tooltip de hover do livro (sessão 17.10). Funciona com `position:
 * fixed` num portal pro `document.body` — necessário pra contornar o
 * `overflow` clipping dos containers (.shelf-content tem overflow-x: auto,
 * que força overflow-y a `auto` em browsers antigos, cortando tooltips
 * absolute-posicionados acima do livro).
 *
 * Uso:
 *   const { handlers, tooltip } = useBookHover(`${title} — ${author}`);
 *   <div {...handlers}>{children}{tooltip}</div>
 */
export function useBookHover(label: string): {
  handlers: {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
    onMouseMove: (e: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave: () => void;
  };
  tooltip: React.ReactNode;
} {
  const [pos, setPos] = useState<HoverPos | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateFromTarget = (target: HTMLElement) => {
    const r = target.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.top });
  };

  const handlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      updateFromTarget(e.currentTarget);
    },
    onMouseMove: (e: React.MouseEvent<HTMLElement>) => {
      // Atualiza durante drag/scroll — currentTarget pode ter se movido.
      updateFromTarget(e.currentTarget);
    },
    onMouseLeave: () => setPos(null),
  };

  const tooltip =
    mounted && pos && label
      ? createPortal(
          <span
            className="book-hover-label-fixed"
            style={{
              position: "fixed",
              left: pos.x,
              top: pos.y - 10,
              transform: "translate(-50%, -100%)",
            }}
          >
            {label}
          </span>,
          document.body,
        )
      : null;

  return { handlers, tooltip };
}
