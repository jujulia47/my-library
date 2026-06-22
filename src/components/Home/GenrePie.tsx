"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TagIcon } from "@heroicons/react/24/outline";
import { HomeCard, HomeCardEmpty } from "./HomeCard";
import type { GenreDistribution } from "@/services/homeData";
import { PIE_COLORS_HEX } from "@/utils/colorByHash";

// Paleta posicional (não hash) — usa a mesma rotação café+verde+azul+vinho
// de `colorByHash.PIE_COLORS_HEX` pra manter coerência visual com Box/
// CollectionCard. Aqui é por índice (não hash do nome) pra garantir que
// fatias adjacentes não colidam — a primeira fatia é sempre a maior, então
// duplicatas só caem em minoritárias se passar de 8 gêneros.
function colorForIndex(idx: number): string {
  return PIE_COLORS_HEX[idx % PIE_COLORS_HEX.length];
}

const VIEW = 160;
const CENTER = VIEW / 2;
const RADIUS = 68;
const HOVER_PUSH = 6; // px que a fatia desliza pra fora no hover

type Props = {
  data: GenreDistribution[];
};

// Arredonda pra 4 casas decimais. Math.cos/sin podem variar no último bit
// entre Node (server-render) e V8 (cliente), o que quebra hidratação do
// SVG `d`. 4 casas = 0.0001 unidade SVG = sub-pixel num viewBox de 160.
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function buildSlicePath(startAngle: number, endAngle: number): string {
  // Caso especial: 1 fatia única ocupa o círculo todo. SVG arc não desenha
  // arco completo (start === end), então usamos dois arcos de 180°.
  if (Math.abs(endAngle - startAngle - Math.PI * 2) < 0.001) {
    const top = `${CENTER} ${CENTER - RADIUS}`;
    const bottom = `${CENTER} ${CENTER + RADIUS}`;
    return `M ${top} A ${RADIUS} ${RADIUS} 0 1 1 ${bottom} A ${RADIUS} ${RADIUS} 0 1 1 ${top} Z`;
  }
  const x1 = round4(CENTER + RADIUS * Math.cos(startAngle));
  const y1 = round4(CENTER + RADIUS * Math.sin(startAngle));
  const x2 = round4(CENTER + RADIUS * Math.cos(endAngle));
  const y2 = round4(CENTER + RADIUS * Math.sin(endAngle));
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export function GenrePie({ data }: Props) {
  const router = useRouter();
  // Cada fatia ganha um scale 0→1 escalonado em 80ms. `revealedCount`
  // controla quantas já estão "abertas".
  const [revealedCount, setRevealedCount] = useState(0);
  // Hover bidirecional: setado tanto ao passar mouse na fatia (SVG) quanto
  // no item da legenda. Quando !== null, fatia destacada (translate pra fora
  // + tooltip ON sobre o centro da fatia), demais reduzem opacidade.
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Navega pra detail page da categoria. "Sem gênero" não tem slug — clique
  // é no-op nesse caso.
  function goToCategory(idx: number) {
    const slug = data[idx]?.slug;
    if (slug) router.push(`/category/${slug}`);
  }

  useEffect(() => {
    if (data.length === 0) return;
    setRevealedCount(0);
    const timeouts = data.map((_, idx) =>
      setTimeout(() => setRevealedCount((n) => Math.max(n, idx + 1)), 200 + idx * 80),
    );
    return () => timeouts.forEach(clearTimeout);
  }, [data]);

  // Pré-computa ângulos e ancoragem do tooltip — tooltip vai FORA da fatia,
  // logo após a borda do raio, na direção do ângulo médio. Anchor +
  // translate baseados em cos/sin pra que o tooltip se "afaste" do centro
  // (fatia à direita → tooltip extende pra direita, etc).
  const TOOLTIP_OFFSET = 12; // px além da borda do raio
  let cumulativeAngle = -Math.PI / 2; // começa às 12h
  const slices = data.map((item, idx) => {
    const sliceAngle = (item.percent / 100) * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    const midAngle = (startAngle + endAngle) / 2;
    const path = buildSlicePath(startAngle, endAngle);
    cumulativeAngle = endAngle;
    const cosA = Math.cos(midAngle);
    const sinA = Math.sin(midAngle);
    return {
      key: `${item.genre}-${idx}`,
      idx,
      path,
      color: colorForIndex(idx),
      visible: idx < revealedCount,
      // Ancoragem do tooltip — ponto logo fora da fatia no eixo radial.
      // round4 estabiliza precisão pra evitar mismatch entre Node/V8.
      tipX: round4(CENTER + (RADIUS + TOOLTIP_OFFSET) * cosA),
      tipY: round4(CENTER + (RADIUS + TOOLTIP_OFFSET) * sinA),
      // Translate em porcentagem da própria largura/altura do tooltip pra
      // ele crescer "pra fora": cos=1 (direita) → translateX=0% (anchor na
      // borda esquerda); cos=-1 → -100% (anchor na borda direita); cos=0
      // → -50% (centralizado horizontalmente). Idem pro Y.
      tipTranslateX: round4(-((1 - cosA) / 2) * 100),
      tipTranslateY: round4(-((1 - sinA) / 2) * 100),
      // Vetor unitário no sentido radial pra "puxar a fatia pra fora".
      pushDx: round4(HOVER_PUSH * cosA),
      pushDy: round4(HOVER_PUSH * sinA),
    };
  });

  const hovered = hoveredIdx !== null ? slices[hoveredIdx] : null;
  const hoveredItem = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <HomeCard title="Gênero" icon={<TagIcon className="w-3.5 h-3.5" />}>
      {data.length === 0 ? (
        <HomeCardEmpty>Sem gêneros classificados</HomeCardEmpty>
      ) : (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
          <div className="relative flex-shrink-0" style={{ width: VIEW, height: VIEW }}>
            <svg
              width={VIEW}
              height={VIEW}
              viewBox={`0 0 ${VIEW} ${VIEW}`}
              aria-hidden
            >
              {slices.map((s) => {
                const isHovered = hoveredIdx === s.idx;
                const isOther = hoveredIdx !== null && !isHovered;
                const baseTransform = s.visible ? "scale(1)" : "scale(0)";
                const pushTransform = isHovered && s.visible
                  ? `translate(${s.pushDx}px, ${s.pushDy}px)`
                  : "";
                const hasSlug = data[s.idx]?.slug !== null;
                return (
                  <path
                    key={s.key}
                    d={s.path}
                    fill={s.color}
                    onMouseEnter={() => setHoveredIdx(s.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => goToCategory(s.idx)}
                    style={{
                      transform: `${pushTransform} ${baseTransform}`.trim(),
                      transformOrigin: `${CENTER}px ${CENTER}px`,
                      transition:
                        "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease",
                      opacity: isOther ? 0.45 : 1,
                      cursor: hasSlug ? "pointer" : "default",
                    }}
                  />
                );
              })}
            </svg>

            {hovered && hoveredItem && (
              <div
                className="absolute pointer-events-none bg-ink-deep text-ivory rounded px-2 py-1 shadow-card whitespace-nowrap z-10"
                style={{
                  left: hovered.tipX,
                  top: hovered.tipY,
                  transform: `translate(${hovered.tipTranslateX}%, ${hovered.tipTranslateY}%)`,
                }}
                role="status"
                aria-live="polite"
              >
                <span className="text-xs font-medium">
                  {hoveredItem.genre}
                </span>
                <span className="ml-1.5 text-[11px] text-gold tabular-nums">
                  {hoveredItem.percent}%
                </span>
              </div>
            )}
          </div>

          <ul className="flex-1 min-w-0 w-full grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-body self-center">
            {data.map((item, idx) => {
              const isHovered = hoveredIdx === idx;
              const hasSlug = item.slug !== null;
              return (
                <li
                  key={`${item.genre}-${idx}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => goToCategory(idx)}
                  className={`flex items-center gap-1.5 min-w-0 rounded px-1 -mx-1 transition-colors ${
                    hasSlug ? "cursor-pointer" : "cursor-default"
                  } ${isHovered ? "bg-paper-soft" : ""}`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0 transition-transform"
                    style={{
                      backgroundColor: colorForIndex(idx),
                      transform: isHovered ? "scale(1.4)" : "scale(1)",
                    }}
                    aria-hidden
                  />
                  <span
                    className={`truncate transition-colors ${
                      isHovered ? "text-ink-deep font-medium" : "text-ink-soft"
                    }`}
                    title={item.genre}
                  >
                    {item.genre}
                  </span>
                  <span className="ml-auto text-ink-fade tabular-nums">
                    {item.percent}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </HomeCard>
  );
}
