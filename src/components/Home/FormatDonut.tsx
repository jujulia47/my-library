"use client";

import { useEffect, useState } from "react";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import { HomeCard, HomeCardEmpty } from "./HomeCard";
import type { FormatDistribution } from "@/services/homeData";

// Paleta "café" — tons quentes harmonizados com os browns de /year.
// Hex direto (em vez de `var(...)`) porque a inline-style do SVG estava
// dando hydration mismatch quando o bundle do client ficava atrás do
// servidor — string literal é determinístico SSR + CSR.
const FORMAT_COLOR: Record<string, string> = {
  physical: "#6D3914", // roasted-chestnut
  ebook: "#AB7843", // caramel-drizzle
  audiobook: "#173125", // forest
  unknown: "#4C2B08", // espresso-shot
};

const FORMAT_LABEL: Record<string, string> = {
  physical: "Físico",
  ebook: "E-book",
  audiobook: "Audiobook",
  unknown: "Outro",
};

const VIEW = 130;
const CENTER = VIEW / 2;
const RADIUS = 52;
const STROKE = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 6; // pequeno espaço visual entre segmentos

type Props = {
  data: FormatDistribution[];
};

export function FormatDonut({ data }: Props) {
  const total = data.reduce((acc, d) => acc + d.count, 0);
  const [animatedFraction, setAnimatedFraction] = useState(0);

  useEffect(() => {
    if (data.length === 0) return;
    const startTime = Date.now();
    const delay = 200;
    const duration = 1200;
    let raf = 0;
    const tick = () => {
      const elapsed = Date.now() - startTime - delay;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedFraction(eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [data.length]);

  // Cada segmento ocupa fração proporcional do perímetro útil (perímetro
  // total - gaps). `cumulative` permite posicionar via dashoffset.
  const usableLength = CIRCUMFERENCE - data.length * GAP;
  let cumulative = 0;
  const segments = data.map((item) => {
    const length = (item.percent / 100) * usableLength;
    const offset = cumulative;
    cumulative += length + GAP;
    return { item, length, offset };
  });

  return (
    <HomeCard title="Formato" icon={<BookOpenIcon className="w-3.5 h-3.5" />}>
      {data.length === 0 ? (
        <HomeCardEmpty>Sem livros lidos ainda</HomeCardEmpty>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 relative">
            <svg
              width={VIEW}
              height={VIEW}
              viewBox={`0 0 ${VIEW} ${VIEW}`}
              aria-hidden
            >
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke="var(--color-paper-soft)"
                strokeWidth={STROKE}
              />
              {segments.map(({ item, length, offset }) => {
                const drawn = Math.max(0, length * animatedFraction);
                return (
                  <circle
                    key={item.format}
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS}
                    fill="none"
                    stroke={FORMAT_COLOR[item.format] ?? FORMAT_COLOR.unknown}
                    strokeWidth={STROKE}
                    strokeLinecap="butt"
                    strokeDasharray={`${drawn} ${CIRCUMFERENCE}`}
                    strokeDashoffset={-offset}
                    transform={`rotate(-90 ${CENTER} ${CENTER})`}
                  />
                );
              })}
              <text
                x={CENTER}
                y={CENTER + 2}
                textAnchor="middle"
                className="font-display"
                fontSize="26"
                fontWeight="500"
                fill="var(--color-ink-deep)"
              >
                {total}
              </text>
              <text
                x={CENTER}
                y={CENTER + 18}
                textAnchor="middle"
                fontSize="11"
                fill="var(--color-ink-fade)"
              >
                {total === 1 ? "livro" : "livros"}
              </text>
            </svg>
          </div>

          <ul className="flex-1 min-w-0 flex flex-col gap-1.5 text-xs font-body">
            {data.map((item) => (
              <li
                key={item.format}
                className="flex items-center gap-2 min-w-0"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      FORMAT_COLOR[item.format] ?? FORMAT_COLOR.unknown,
                  }}
                  aria-hidden
                />
                <span className="text-ink-soft truncate">
                  {FORMAT_LABEL[item.format] ?? item.format}
                </span>
                <span className="ml-auto text-ink-fade tabular-nums">
                  {item.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </HomeCard>
  );
}
