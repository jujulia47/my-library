"use client";

import { useEffect, useState } from "react";

const DESKTOP_COUNT = 30;
const MOBILE_COUNT = 12;

type Mote = {
  left: number;
  delay: number;
  duration: number;
  size: number;
};

/**
 * Partículas de poeira flutuando lentamente (efeito ambiente da `/library`).
 *
 * Sessão 17.7: gerar `Math.random()` no body do componente causava hydration
 * mismatch (SSR e CSR sorteavam valores diferentes). Agora as motes são
 * geradas APENAS no client, dentro de useEffect — server renderiza container
 * vazio. Hydration limpa, tradeoff: 1 frame sem motes (imperceptível).
 */
export function DustMotes() {
  const [motes, setMotes] = useState<Mote[]>([]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? MOBILE_COUNT : DESKTOP_COUNT;
    const generated: Mote[] = Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 30,
      duration: 20 + Math.random() * 20,
      size: 1 + Math.random() * 2,
    }));
    setMotes(generated);
  }, []);

  return (
    <div className="dust-motes" aria-hidden>
      {motes.map((m, i) => (
        <span
          key={i}
          className="dust-mote"
          style={{
            left: `${m.left}%`,
            width: `${m.size}px`,
            height: `${m.size}px`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
