"use client";

import { useEffect, useState } from "react";
import { TagIcon } from "@heroicons/react/24/outline";
import { HomeCard, HomeCardEmpty } from "./HomeCard";
import { colorHexForName } from "@/utils/colorByHash";
import type { GenreDistribution } from "@/services/homeData";

// Sessão 17.3: paleta de cores agora vem de `colorByHash` — 8 cores cíclicas
// estáveis por nome da categoria. Garante que "Fantasia" sempre seja a mesma
// cor mesmo que mude de posição na lista.

const VIEW = 110;
const CENTER = VIEW / 2;
const RADIUS = 44;

type Props = {
  data: GenreDistribution[];
};

function buildSlicePath(
  startAngle: number,
  endAngle: number,
): string {
  // Caso especial: 1 fatia única ocupa o círculo todo. SVG arc não desenha
  // arco completo (start === end), então usamos dois arcos de 180°.
  if (Math.abs(endAngle - startAngle - Math.PI * 2) < 0.001) {
    const top = `${CENTER} ${CENTER - RADIUS}`;
    const bottom = `${CENTER} ${CENTER + RADIUS}`;
    return `M ${top} A ${RADIUS} ${RADIUS} 0 1 1 ${bottom} A ${RADIUS} ${RADIUS} 0 1 1 ${top} Z`;
  }
  const x1 = CENTER + RADIUS * Math.cos(startAngle);
  const y1 = CENTER + RADIUS * Math.sin(startAngle);
  const x2 = CENTER + RADIUS * Math.cos(endAngle);
  const y2 = CENTER + RADIUS * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export function GenrePie({ data }: Props) {
  // Cada fatia ganha um scale 0→1 escalonado em 80ms. `revealedCount`
  // controla quantas já estão "abertas". Cada slice individualmente
  // transiciona transform graças ao CSS.
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    if (data.length === 0) return;
    setRevealedCount(0);
    const timeouts = data.map((_, idx) =>
      setTimeout(() => setRevealedCount((n) => Math.max(n, idx + 1)), 200 + idx * 80),
    );
    return () => timeouts.forEach(clearTimeout);
  }, [data]);

  let cumulativeAngle = -Math.PI / 2; // começa às 12h
  const slices = data.map((item, idx) => {
    const sliceAngle = (item.percent / 100) * 2 * Math.PI;
    const path = buildSlicePath(
      cumulativeAngle,
      cumulativeAngle + sliceAngle,
    );
    cumulativeAngle += sliceAngle;
    return {
      key: `${item.genre}-${idx}`,
      path,
      color: colorHexForName(item.genre),
      visible: idx < revealedCount,
    };
  });

  return (
    <HomeCard title="Gênero" icon={<TagIcon className="w-3.5 h-3.5" />}>
      {data.length === 0 ? (
        <HomeCardEmpty>Sem gêneros classificados</HomeCardEmpty>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <svg
            width={VIEW}
            height={VIEW}
            viewBox={`0 0 ${VIEW} ${VIEW}`}
            aria-hidden
          >
            {slices.map((s) => (
              <path
                key={s.key}
                d={s.path}
                fill={s.color}
                style={{
                  transform: s.visible ? "scale(1)" : "scale(0)",
                  transformOrigin: `${CENTER}px ${CENTER}px`,
                  transition:
                    "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              />
            ))}
          </svg>

          <ul className="w-full flex flex-col gap-1 text-xs font-body">
            {data.map((item, idx) => (
              <li
                key={`${item.genre}-${idx}`}
                className="flex items-center gap-2 min-w-0"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: colorHexForName(item.genre),
                  }}
                  aria-hidden
                />
                <span className="text-ink-soft truncate" title={item.genre}>
                  {item.genre}
                </span>
                <span className="ml-auto text-ink-fade tabular-nums">
                  {item.percent}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </HomeCard>
  );
}
