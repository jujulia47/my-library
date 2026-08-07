"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "./useReducedMotion";

type Props = {
  children: ReactNode;
  className?: string;
  /** Deslocamento vertical inicial em px (padrão 24). */
  y?: number;
  /** Atraso da entrada em ms. */
  delay?: number;
  /** Duração da transição em ms. */
  duration?: number;
  /** Revela uma vez só (padrão) ou toda vez que entra/sai da tela. */
  once?: boolean;
};

/**
 * Aparece (fade + slide) quando entra na viewport. Base das entradas em
 * cascata do app. Cai pro estado final imediato em movimento reduzido.
 */
export function Reveal({
  children,
  className,
  y = 24,
  delay = 0,
  duration = 700,
  once = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (reduced) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            if (once) io.disconnect();
          } else if (!once) {
            setShown(false);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, once]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translateY(${y}px)`,
        transition: reduced
          ? undefined
          : `opacity ${duration}ms ease, transform ${duration}ms cubic-bezier(.2,.7,.2,1)`,
        transitionDelay: shown ? `${delay}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}
