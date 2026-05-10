"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { HomeCard } from "./HomeCard";
import type { PaceSparkline, PaceTrend } from "@/services/homeData";

const VIEW_W = 200;
const VIEW_H = 60;
const STROKE_LENGTH_FALLBACK = 600; // > qualquer length real do path

const TREND_LABEL: Record<PaceTrend, string> = {
  up: "em alta",
  down: "em queda",
  stable: "estável",
};

type Props = {
  data: PaceSparkline;
};

export function ReadingPaceSparkline({ data }: Props) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const gradId = useId();
  const [pathLength, setPathLength] = useState<number | null>(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Mede o comprimento real do path (depende dos valores) pra usar como
  // base do dasharray. Fallback (STROKE_LENGTH_FALLBACK) cobre qualquer
  // overshoot enquanto o path ainda não foi montado no DOM.
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [data.values]);

  useEffect(() => {
    const startTime = Date.now();
    const delay = 500;
    const duration = 1500;
    let raf = 0;
    const tick = () => {
      const elapsed = Date.now() - startTime - delay;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedProgress(eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [data.values]);

  const max = Math.max(...data.values, 1);
  // Pad superior pra evitar pontos colados no topo do SVG (e linha
  // espessada). Reservar 4px no topo/inferior.
  const PAD_TOP = 4;
  const PAD_BOTTOM = 4;
  const drawableH = VIEW_H - PAD_TOP - PAD_BOTTOM;

  const points = data.values
    .map((v, idx) => {
      const x =
        data.values.length === 1
          ? VIEW_W / 2
          : (idx / (data.values.length - 1)) * VIEW_W;
      const y = VIEW_H - PAD_BOTTOM - (v / max) * drawableH;
      return { x, y };
    })
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  const linePath = `M ${points.replace(/ /g, " L ")}`;
  const areaPath = `M 0,${VIEW_H} L ${points.replace(/ /g, " L ")} L ${VIEW_W},${VIEW_H} Z`;

  const baseLength = pathLength ?? STROKE_LENGTH_FALLBACK;
  const dashOffset = baseLength * (1 - animatedProgress);

  return (
    <HomeCard
      title="Ritmo (30 dias)"
      icon={<ChartBarIcon className="w-3.5 h-3.5" />}
    >
      <div className="flex-1 flex flex-col justify-between">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          style={{ width: "100%", height: VIEW_H }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={gradId}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              {/* Sessão 17.3: cor moss em vez de gold (ritmo = e-book/finished
                  na semântica). Wash mais leve no topo. */}
              <stop offset="0%" stopColor="#5C6E47" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#5C6E47" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path
            d={areaPath}
            fill={`url(#${gradId})`}
            style={{
              opacity: animatedProgress,
              transition: "opacity 0.3s ease",
            }}
          />

          <path
            ref={pathRef}
            d={linePath}
            fill="none"
            stroke="#5C6E47"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={baseLength}
            strokeDashoffset={dashOffset}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="font-display text-2xl font-medium text-ink-deep leading-none">
            {data.average_per_day
              .toLocaleString("pt-BR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
          </span>
          <TrendIcon trend={data.trend} />
          <span className="text-xs text-ink-fade font-body">pág/dia</span>
          <span className="ml-auto text-[10px] italic text-ink-fade font-body">
            {TREND_LABEL[data.trend]}
          </span>
        </div>
      </div>
    </HomeCard>
  );
}

function TrendIcon({ trend }: { trend: PaceTrend }) {
  if (trend === "up") {
    return (
      <ArrowTrendingUpIcon
        className="w-4 h-4 text-moss pace-trend-icon"
        aria-label="ritmo subindo"
      />
    );
  }
  if (trend === "down") {
    return (
      <ArrowTrendingDownIcon
        className="w-4 h-4 text-burgundy pace-trend-icon"
        aria-label="ritmo caindo"
      />
    );
  }
  return (
    <MinusIcon
      className="w-4 h-4 text-ink-fade pace-trend-icon"
      aria-label="ritmo estável"
    />
  );
}
