"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

type Props = {
  value: number;
  /** Duração da contagem em ms. */
  duration?: number;
  className?: string;
  /** Formata o número (padrão: inteiro com separador pt-BR). */
  format?: (n: number) => string;
};

/**
 * Conta de 0 até `value` quando entra na tela. Em movimento reduzido, mostra
 * o valor final direto.
 */
export function CountUp({ value, duration = 1200, className, format }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const started = useRef(false);
  const fmt = format ?? ((n: number) => Math.round(n).toLocaleString("pt-BR"));

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const t0 = performance.now();
            const tick = (t: number) => {
              const p = Math.min(1, (t - t0) / duration);
              const eased = 1 - Math.pow(1 - p, 3);
              setDisplay(value * eased);
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, value, duration]);

  return (
    <span ref={ref} className={className}>
      {fmt(display)}
    </span>
  );
}
