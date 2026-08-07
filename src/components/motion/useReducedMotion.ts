"use client";

import { useEffect, useState } from "react";

/**
 * `true` quando o usuário pediu movimento reduzido no SO. Todo componente de
 * animação deve cair pro estado final (sem transição) quando isso é `true`.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}
