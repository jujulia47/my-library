"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { MonthlyTimeline, TimelineReading } from "@/services/yearData";

// =============================================================================
// Constantes
// =============================================================================

// Sessão 17.8: bump adicional sobre 17.2.6 — tipografia da timeline
// reportada como ainda pequena. Header maior, day height +30%, lane offset
// pra absorver títulos maiores.
const MONTH_WIDTH = 220;
const MONTH_HEADER_HEIGHT = 64;
const DAY_HEIGHT = 18;
const DAYS_TOTAL = 31;
const TOTAL_HEIGHT = MONTH_HEADER_HEIGHT + DAYS_TOTAL * DAY_HEIGHT + 24;
const PADDING_X = 32;
const READING_X_BASE = PADDING_X + 6;
const LANE_OFFSET = 20;

const MONTH_NAMES_PT = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

// Paleta de 8 cores cíclicas (sessão 17.3 — alinhada ao doc design-refresh).
// Mesma rotação usada em GenrePie (via colorByHash); coerência visual entre
// views. Sem rosa-fuchsia (fora da identidade outono); sem cappuccino puro
// (conflita com cor de borda neutra).
const COLORS = [
  "#82393A", // burgundy
  "#5C6E47", // moss
  "#1E3A5F", // navy
  "#BC6E48", // terracota
  "#85614B", // olive
  "#A0843E", // gold-deep
  "#8B6F50", // cappuccino-soft
  "#6B5D4F", // ink-soft
];

// =============================================================================
// Helpers
// =============================================================================

/**
 * Decide quantas colunas mensais cabem por SVG baseado na largura do
 * container. Sessão 17.2.5: breakpoints recalibrados.
 *
 * **Causa do bug "sempre 2 cols"**: o `<AppShell>` envolve a página em
 * `max-w-6xl mx-auto px-6` (1152 - 48 = 1104px máx). Os breakpoints antigos
 * (1280/1700/2200) supunham viewport sem cap; o container nunca chega lá,
 * então sempre caía em 2.
 *
 * Cada coluna mensal = MONTH_WIDTH (220px). Mantemos folga pra padding e pra
 * o scroll horizontal não disparar:
 *   1 col = 220px,  2 = 440px,  3 = 660px,  4 = 880px
 * 4 cols cabe folgado no container atual (1104px).
 *
 * 5+ cols ficaria limitado pelo container — não habilitamos. Se quiser
 * permitir 5/6, expandir o container no /year (negative margins no
 * YearTimeline) e revisitar este map.
 */
function getColumnsPerSvg(width: number): number {
  if (width < 500) return 1;
  if (width < 700) return 2;
  if (width < 900) return 3;
  return 4;
}

/**
 * Atribui readings em "lanes" (faixas laterais) pra evitar sobreposição
 * visual em meses com várias leituras simultâneas. Greedy: ordena por
 * start_day, encaixa na primeira lane livre.
 */
function assignLanes(
  readings: TimelineReading[],
): Map<string, number> {
  const sorted = [...readings].sort((a, b) => {
    if (a.start_day !== b.start_day) return a.start_day - b.start_day;
    return a.reading_id.localeCompare(b.reading_id);
  });
  const lanes: TimelineReading[][] = [];
  const out = new Map<string, number>();

  for (const r of sorted) {
    let placed = false;
    for (let i = 0; i < lanes.length; i += 1) {
      const last = lanes[i][lanes[i].length - 1];
      if (last.end_day < r.start_day) {
        lanes[i].push(r);
        out.set(r.reading_id, i);
        placed = true;
        break;
      }
    }
    if (!placed) {
      lanes.push([r]);
      out.set(r.reading_id, lanes.length - 1);
    }
  }
  return out;
}

function strokeDashFor(
  status: TimelineReading["status_at_end"],
): string | undefined {
  if (status === "finished") return undefined;
  if (status === "abandoned") return "1 4";
  // paused / continues_next_month → tracejado padrão
  return "5 3";
}

function buildTooltip(r: TimelineReading, monthIndex: number): string {
  const month = monthIndex + 1;
  const parts = [
    `${r.title}`,
    `${r.start_day}/${month} → ${r.end_day}/${month}`,
  ];
  if (r.duration_days)
    parts.push(`${r.duration_days} ${r.duration_days === 1 ? "dia" : "dias"} no total`);
  if (r.pages_read) parts.push(`${r.pages_read} páginas`);
  if (r.author_name) parts.push(r.author_name);
  return parts.join(" · ");
}

// =============================================================================
// Componente principal
// =============================================================================

type Props = {
  timeline: MonthlyTimeline[];
  year: number;
};

export function YearTimeline({ timeline, year }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnsPerSvg, setColumnsPerSvg] = useState<number>(3);

  useEffect(() => {
    if (!containerRef.current) return;
    setColumnsPerSvg(getColumnsPerSvg(containerRef.current.clientWidth));
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setColumnsPerSvg(getColumnsPerSvg(w));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Quebra em chunks de N colunas
  const chunks: MonthlyTimeline[][] = [];
  for (let i = 0; i < timeline.length; i += columnsPerSvg) {
    chunks.push(timeline.slice(i, i + columnsPerSvg));
  }

  return (
    <div ref={containerRef} className="space-y-4 mt-2">
      {chunks.map((chunk, idx) => (
        <TimelineChunkSvg key={idx} months={chunk} year={year} />
      ))}
    </div>
  );
}

// =============================================================================
// SVG de N colunas mensais
// =============================================================================

function TimelineChunkSvg({
  months,
  year,
}: {
  months: MonthlyTimeline[];
  year: number;
}) {
  const cols = months.length;
  const svgWidth = cols * MONTH_WIDTH;
  return (
    <div className="overflow-x-auto">
      <svg
        width={svgWidth}
        height={TOTAL_HEIGHT}
        viewBox={`0 0 ${svgWidth} ${TOTAL_HEIGHT}`}
        className="block"
        role="img"
        aria-label={`Linha do tempo de ${months.length} meses`}
      >
        {months.map((month, idx) => (
          <MonthColumn
            key={month.month}
            month={month}
            year={year}
            offsetX={idx * MONTH_WIDTH}
          />
        ))}
      </svg>
    </div>
  );
}

function MonthColumn({
  month,
  year,
  offsetX,
}: {
  month: MonthlyTimeline;
  year: number;
  offsetX: number;
}) {
  const lanes = assignLanes(month.readings);
  const monthName = MONTH_NAMES_PT[month.month - 1];

  return (
    <g transform={`translate(${offsetX}, 0)`}>
      {/* Header — fontes 17.8: maiores e mais legíveis. */}
      <text
        x={PADDING_X}
        y={24}
        fontSize="16"
        fontWeight="600"
        letterSpacing="1.5"
        fontFamily="var(--font-display)"
        fill="var(--color-ink-deep)"
      >
        {monthName} {String(year).slice(-2)}
      </text>
      <text
        x={PADDING_X}
        y={46}
        fontSize="13"
        fill={month.has_readings ? "var(--color-ink-soft)" : "var(--color-ink-fade)"}
        fontStyle={month.has_readings ? "normal" : "italic"}
      >
        {month.has_readings
          ? `${month.book_count} ${month.book_count === 1 ? "livro" : "livros"}`
          : "sem leituras"}
      </text>
      {month.is_best_month && (
        <text
          x={MONTH_WIDTH - 10}
          y={24}
          fontSize="12"
          fontWeight="500"
          fill="#EF9F27"
          textAnchor="end"
        >
          ★ melhor mês
        </text>
      )}

      {/* Eixo vertical: trilho sutil — um pouco mais grosso pra ler melhor. */}
      <line
        x1={PADDING_X}
        y1={MONTH_HEADER_HEIGHT}
        x2={PADDING_X}
        y2={MONTH_HEADER_HEIGHT + DAYS_TOTAL * DAY_HEIGHT}
        stroke="var(--color-paper-soft)"
        strokeWidth="1.5"
      />

      {/* Labels de dias-âncora */}
      {[1, 5, 10, 15, 20, 25, 31].map((day) => (
        <text
          key={day}
          x={PADDING_X - 8}
          y={MONTH_HEADER_HEIGHT + (day - 1) * DAY_HEIGHT + 5}
          fontSize="10"
          fill="var(--color-ink-fade)"
          textAnchor="end"
        >
          {day}
        </text>
      ))}

      {!month.has_readings && (
        <text
          x={MONTH_WIDTH / 2}
          y={MONTH_HEADER_HEIGHT + (DAYS_TOTAL * DAY_HEIGHT) / 2}
          fontSize="14"
          fontStyle="italic"
          fontFamily="var(--font-display)"
          fill="var(--color-ink-fade)"
          textAnchor="middle"
          opacity="0.6"
        >
          Mês sem leituras
        </text>
      )}

      {month.readings.map((r) => (
        <ReadingLine
          key={`${r.reading_id}-${month.month}`}
          reading={r}
          lane={lanes.get(r.reading_id) ?? 0}
          monthIndex={month.month - 1}
        />
      ))}
    </g>
  );
}

function ReadingLine({
  reading,
  lane,
  monthIndex,
}: {
  reading: TimelineReading;
  lane: number;
  monthIndex: number;
}) {
  const x = READING_X_BASE + lane * LANE_OFFSET;
  const y1 = MONTH_HEADER_HEIGHT + (reading.start_day - 1) * DAY_HEIGHT + DAY_HEIGHT / 2;
  const y2 = MONTH_HEADER_HEIGHT + (reading.end_day - 1) * DAY_HEIGHT + DAY_HEIGHT / 2;
  const color = COLORS[reading.color_index] ?? COLORS[0];
  const dashArray = strokeDashFor(reading.status_at_end);
  const tooltip = buildTooltip(reading, monthIndex);

  // Texto à direita da linha — alinhado com lane × espacejamento. Trunca pra
  // caber no espaço restante da coluna.
  const textX = x + 7;
  const labelMaxChars = 22;
  const titleShort =
    reading.title.length > labelMaxChars
      ? `${reading.title.slice(0, labelMaxChars - 1)}…`
      : reading.title;

  return (
    <g>
      <title>{tooltip}</title>
      <Link href={`/book/${reading.book_slug}`} aria-label={`${reading.title} — abrir livro`}>
        {/* Linha vertical */}
        <line
          x1={x}
          y1={y1}
          x2={x}
          y2={y2}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={dashArray}
        />

        {/* Bolinha início */}
        <circle cx={x} cy={y1} r={2.6} fill={color} />

        {/* Bolinha fim — círculo cheio quando finished, anel quando outro */}
        {reading.status_at_end === "finished" ? (
          <circle cx={x} cy={y2} r={3.2} fill={color} />
        ) : (
          <circle
            cx={x}
            cy={y2}
            r={3.2}
            fill="var(--color-paper)"
            stroke={color}
            strokeWidth="1.4"
          />
        )}

        {/* Seta "veio do ano anterior" */}
        {reading.came_from_previous_year && (
          <text
            x={x - 5}
            y={y1 + 3}
            fontSize="11"
            fill={color}
            textAnchor="end"
          >
            ←
          </text>
        )}

        {/* Título + autor — fontes 17.8 (mais legíveis). */}
        <text
          x={textX}
          y={y1 + 6}
          fontSize="13"
          fontWeight="500"
          fill="var(--color-ink-deep)"
        >
          {titleShort}
        </text>
        {reading.author_name && (
          <text
            x={textX}
            y={y1 + 21}
            fontSize="11"
            fontStyle="italic"
            fill="var(--color-ink-fade)"
          >
            {reading.author_name.length > labelMaxChars
              ? `${reading.author_name.slice(0, labelMaxChars - 1)}…`
              : reading.author_name}
            {reading.rating ? ` · ${"★".repeat(reading.rating)}` : ""}
          </text>
        )}
      </Link>
    </g>
  );
}
