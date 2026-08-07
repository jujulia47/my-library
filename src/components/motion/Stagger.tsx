"use client";

import { Children, type ReactNode } from "react";
import { Reveal } from "./Reveal";

type Props = {
  children: ReactNode;
  className?: string;
  /** Passo entre a entrada de cada filho, em ms. */
  step?: number;
  /** Atraso inicial antes do primeiro filho, em ms. */
  delay?: number;
  y?: number;
  duration?: number;
};

/**
 * Revela os filhos em cascata (cada um com um atraso incremental). O wrapper
 * externo recebe `className` (use pra grid/flex); cada filho vira um item.
 */
export function Stagger({
  children,
  className,
  step = 70,
  delay = 0,
  y,
  duration,
}: Props) {
  return (
    <div className={className}>
      {Children.map(children, (child, i) => (
        <Reveal delay={delay + i * step} y={y} duration={duration}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
