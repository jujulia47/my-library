"use client";

import clsx from "clsx";
import { useState, type ReactNode } from "react";

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={clsx("animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <path fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
    </svg>
  );
}

/** Delay antes do spinner: mostra o ícone "pressionado" por ~1s primeiro. */
const SPINNER_DELAY_MS = 1000;

type Props = {
  /** Ícone padrão. */
  icon: ReactNode;
  /**
   * Ação. Se retornar Promise, o botão mostra o feedback (preenche → spinner)
   * até resolver — o caller não precisa controlar estado de loading.
   */
  onClick: () => void | Promise<unknown>;
  /** aria-label (obrigatório — botão só de ícone). */
  label: string;
  title?: string;
  disabled?: boolean;
  /** Classes de cor/padding do botão (herda a paleta do contexto). */
  className?: string;
  /**
   * Cor do ícone quando pressionado/preenchido — normalmente a mesma do hover
   * (ex.: "text-burgundy" na lixeira). Sem ela, preenche com a cor atual.
   */
  activeColorClass?: string;
  /** Tamanho do spinner (default w-4 h-4 — case o ícone). */
  size?: string;
};

/**
 * Botão só-ícone com feedback de ação em desktop E mobile:
 *  - no clique: encolhe (active:scale) + o ícone fica PREENCHIDO na hora;
 *  - se a ação demorar (> ~1s): troca o ícone pelo spinner;
 *  - reentrância bloqueada (não dispara 2x).
 *
 * Resolve o mobile não ter hover: fica claro que a ação começou.
 */
export function IconActionButton({
  icon,
  onClick,
  label,
  title,
  disabled,
  className,
  activeColorClass,
  size = "w-4 h-4",
}: Props) {
  const [pressed, setPressed] = useState(false);
  const [spinning, setSpinning] = useState(false);

  const handle = async () => {
    if (pressed || disabled) return;
    setPressed(true);
    const result = onClick();
    if (result instanceof Promise) {
      // Só troca pro spinner se a ação passar de ~1s — pra ação rápida fica só
      // o "preenchido" piscando, sem flash de spinner.
      const timer = setTimeout(() => setSpinning(true), SPINNER_DELAY_MS);
      try {
        await result;
      } finally {
        clearTimeout(timer);
        setSpinning(false);
        setPressed(false);
      }
    } else {
      // Ação síncrona (ex.: abrir modal): segura o "preenchido" por um beat.
      setTimeout(() => setPressed(false), SPINNER_DELAY_MS);
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={disabled || pressed}
      aria-label={label}
      aria-busy={spinning || undefined}
      title={title ?? label}
      className={clsx(
        "inline-flex items-center justify-center transition-transform disabled:opacity-60",
        pressed ? "scale-90" : "active:scale-90",
        // Ícone preenchido no clique, na cor da ação (não cinza).
        pressed && !spinning && "[&_svg]:fill-current",
        pressed && !spinning && activeColorClass,
        className,
      )}
    >
      {spinning ? <Spinner className={size} /> : icon}
    </button>
  );
}
