"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SHELF_SLOTS } from "@/utils/shelfLayout";

/**
 * Configuração responsiva da biblioteca: slots por estante (renderização)
 * + alvo de livros pra distribuição na action `shelveAllOrphans`.
 *
 * Breakpoints alinhados com o design system + dimensões típicas de monitor:
 *
 *   ≥ 2200px  → 83 slots / 60 target  (ultrawide)
 *   ≥ 1600px  → 45 slots / 33 target  (desktop largo / 1080p+)
 *   ≥ 1280px  → 35 slots / 25 target  (desktop padrão / laptop 13"+)
 *   ≥ 1024px  → 28 slots / 20 target  (laptop pequeno)
 *   <  1024px → 30 slots / 22 target  (tablet — mobile já faz chunking
 *               sub-row no `ShelfRow`)
 *
 * Target ≈ slots * 0.72 — desconto pra decorações (~8%) e clusters de
 * 5 slots (~12% × 5 = 60% do total mas com 1 visible item cada).
 *
 * Trade-off: decorações reposicionam ao cruzar um breakpoint (porque o
 * `getShelfLayout` regenera). Aceito porque (a) o user raramente fica
 * redimensionando, e (b) dentro do mesmo breakpoint a layout fica estável.
 *
 * SSR-safe: inicia com defaults e atualiza no useEffect (sem hydration
 * mismatch). Pode haver flash visual mínimo na primeira render em
 * viewports muito longe do default.
 */
type ResponsiveConfig = {
  slotCount: number;
  targetCapacity: number;
};

function configForViewport(w: number): ResponsiveConfig {
  if (w >= 2200) return { slotCount: 80, targetCapacity: 58 };
  if (w >= 1600) return { slotCount: 45, targetCapacity: 33 };
  if (w >= 1280) return { slotCount: 35, targetCapacity: 25 };
  if (w >= 1024) return { slotCount: 28, targetCapacity: 20 };
  return { slotCount: DEFAULT_SHELF_SLOTS, targetCapacity: 22 };
}

export function useResponsiveLibraryConfig(): ResponsiveConfig {
  const [cfg, setCfg] = useState<ResponsiveConfig>({
    slotCount: DEFAULT_SHELF_SLOTS,
    targetCapacity: 22,
  });

  useEffect(() => {
    const compute = () => setCfg(configForViewport(window.innerWidth));
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return cfg;
}

/** Atalho — só o slot count (usado pelo `ShelfRow` e `ShelfZoomInline`). */
export function useResponsiveSlotCount(): number {
  return useResponsiveLibraryConfig().slotCount;
}
