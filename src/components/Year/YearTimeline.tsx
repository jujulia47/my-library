"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { MonthlyTimeline, TimelineReading } from "@/services/yearData";

// =============================================================================
// Constantes
// =============================================================================

// MONTH_WIDTH é dinâmico — medido em runtime via ResizeObserver no container
// e dividido pelo número de colunas, com clamp em [MIN, MAX].
const MONTH_WIDTH_MIN = 270;
const MONTH_WIDTH_MAX = 380;
// Header com folga pra título do livro de caso C (ends_here) ficar acima do
// dia 1 sem colidir com a contagem mensal.
const MONTH_HEADER_HEIGHT = 70;
const DAY_HEIGHT = 18;
const DAYS_TOTAL = 31;
const TOTAL_HEIGHT = MONTH_HEADER_HEIGHT + DAYS_TOTAL * DAY_HEIGHT + 24;
const PADDING_X = 32;
const READING_X_BASE = PADDING_X + 6;
// Lane bem mais larga que antes (era 20) — agora a lane carrega o título
// acima da linha, então precisa caber ~12 chars de texto por linha.
const LANE_OFFSET = 80;
const TITLE_FONT_SIZE = 11;
const TITLE_LINE_HEIGHT = 12;
const TITLE_MAX_LINES = 2;
const TITLE_CHARS_PER_LINE = 13;

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

function getLayoutForWidth(containerWidth: number): {
  cols: number;
  monthWidth: number;
} {
  let cols: number;
  if (containerWidth < 560) cols = 1;
  else if (containerWidth < 830) cols = 2;
  else if (containerWidth < 1100) cols = 3;
  else cols = 4;

  const raw = Math.floor(containerWidth / cols);
  const monthWidth = Math.max(MONTH_WIDTH_MIN, Math.min(MONTH_WIDTH_MAX, raw));
  return { cols, monthWidth };
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

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
  return "5 3";
}

// =============================================================================
// Tooltip state — compartilhado entre ReadingLine (origem do hover) e o
// componente HTML que renderiza o tooltip custom (fora da SVG, pra escapar
// das limitações de estilização do <title> nativo do browser).
// =============================================================================

type HoverState = {
  reading: TimelineReading;
  monthIndex: number;
  /** Coords em tela (clientX/Y), prontos pra usar com `position: fixed`. */
  screenX: number;
  screenY: number;
  color: string;
};

type ReadingHoverHandler = (
  reading: TimelineReading,
  monthIndex: number,
  // SVG coords; conversão pra screen coords é responsabilidade do receiver
  // que tem acesso ao ref do <svg> + getScreenCTM().
  svgX: number,
  svgY: number,
  color: string,
) => void;

// =============================================================================
// Componente principal
// =============================================================================

type Props = {
  timeline: MonthlyTimeline[];
  year: number;
};

export function YearTimeline({ timeline, year }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ cols: number; monthWidth: number }>({
    cols: 3,
    monthWidth: MONTH_WIDTH_MIN,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    setLayout(getLayoutForWidth(containerRef.current.clientWidth));
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setLayout(getLayoutForWidth(w));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const chunks: MonthlyTimeline[][] = [];
  for (let i = 0; i < timeline.length; i += layout.cols) {
    chunks.push(timeline.slice(i, i + layout.cols));
  }

  return (
    <div ref={containerRef} className="space-y-4 mt-2">
      {chunks.map((chunk, idx) => (
        <TimelineChunkSvg
          key={idx}
          months={chunk}
          year={year}
          monthWidth={layout.monthWidth}
        />
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
  monthWidth,
}: {
  months: MonthlyTimeline[];
  year: number;
  monthWidth: number;
}) {
  const cols = months.length;
  const svgWidth = cols * monthWidth;

  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<HoverState | null>(null);

  // Converte coords SVG (lógicas do viewBox) → coords de tela (clientX/Y)
  // usando o CTM atual da SVG. `getScreenCTM` retorna a matriz que mapeia
  // pontos do viewBox pra coordenadas do viewport, levando em conta scroll,
  // zoom da página, etc.
  const handleReadingHover: ReadingHoverHandler = (
    reading,
    monthIndex,
    svgX,
    svgY,
    color,
  ) => {
    if (!svgRef.current) return;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const screenX = svgX * ctm.a + svgY * ctm.c + ctm.e;
    const screenY = svgX * ctm.b + svgY * ctm.d + ctm.f;
    setHovered({ reading, monthIndex, screenX, screenY, color });
  };
  const handleReadingLeave = () => setHovered(null);

  return (
    <div className="overflow-x-auto">
      <svg
        ref={svgRef}
        width={svgWidth}
        height={TOTAL_HEIGHT}
        viewBox={`0 0 ${svgWidth} ${TOTAL_HEIGHT}`}
        className="block"
        overflow="hidden"
        role="img"
        aria-label={`Linha do tempo de ${months.length} meses`}
      >
        {months.map((month, idx) => (
          <MonthColumn
            key={month.month}
            month={month}
            year={year}
            offsetX={idx * monthWidth}
            monthWidth={monthWidth}
            onReadingHover={handleReadingHover}
            onReadingLeave={handleReadingLeave}
          />
        ))}
      </svg>
      {hovered && <ReadingTooltip state={hovered} />}
    </div>
  );
}

/**
 * Quebra o título em até `maxLines` linhas, ≈`maxChars` chars cada (estimado
 * pelo tamanho médio de char no font do título). Última linha ganha `…` se a
 * mensagem original não couber por inteiro.
 */
function wrapTitle(
  text: string,
  maxChars: number,
  maxLines: number,
): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  let dropped = 0;
  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) {
      lines.push(current);
      current = "";
    }
    if (lines.length >= maxLines) {
      dropped = words.length - i;
      break;
    }
    current = word.length <= maxChars ? word : `${word.slice(0, maxChars - 1)}…`;
  }
  if (current) {
    if (lines.length < maxLines) lines.push(current);
    else dropped += 1;
  }
  if (dropped > 0 && lines.length > 0) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] =
      last.length >= maxChars - 1
        ? `${last.slice(0, maxChars - 1)}…`
        : `${last}…`;
  }
  return lines;
}

function MonthColumn({
  month,
  year,
  offsetX,
  monthWidth,
  onReadingHover,
  onReadingLeave,
}: {
  month: MonthlyTimeline;
  year: number;
  offsetX: number;
  monthWidth: number;
  onReadingHover: ReadingHoverHandler;
  onReadingLeave: () => void;
}) {
  // Timeline agora só recebe finished slices (filtrado no service); cada
  // leitura ocupa uma lane vertical com o título acima da linha (estilo
  // bullet journal). Slices não-finished vão pro painel "Em outras estradas".
  const lined = month.readings;
  const lanes = assignLanes(lined);
  const monthName = MONTH_NAMES_PT[month.month - 1];

  const totalDays = daysInMonth(year, month.month - 1);

  return (
    <g transform={`translate(${offsetX}, 0)`}>
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
        y={42}
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
          x={monthWidth - 10}
          y={24}
          fontSize="12"
          fontWeight="500"
          fill="#EF9F27"
          textAnchor="end"
        >
          ★ melhor mês
        </text>
      )}

      <line
        x1={PADDING_X}
        y1={MONTH_HEADER_HEIGHT}
        x2={PADDING_X}
        y2={MONTH_HEADER_HEIGHT + totalDays * DAY_HEIGHT}
        stroke="var(--color-paper-soft)"
        strokeWidth="1.5"
      />

      {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
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
          x={monthWidth / 2}
          y={MONTH_HEADER_HEIGHT + (totalDays * DAY_HEIGHT) / 2}
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

      {lined.map((r) => (
        <ReadingLine
          key={`${r.reading_id}-${month.month}`}
          reading={r}
          lane={lanes.get(r.reading_id) ?? 0}
          monthIndex={month.month - 1}
          offsetX={offsetX}
          onHover={onReadingHover}
          onLeave={onReadingLeave}
        />
      ))}
    </g>
  );
}

function ReadingLine({
  reading,
  lane,
  monthIndex,
  offsetX,
  onHover,
  onLeave,
}: {
  reading: TimelineReading;
  lane: number;
  monthIndex: number;
  offsetX: number;
  onHover: ReadingHoverHandler;
  onLeave: () => void;
}) {
  const x = READING_X_BASE + lane * LANE_OFFSET;
  const y1 = MONTH_HEADER_HEIGHT + (reading.start_day - 1) * DAY_HEIGHT + DAY_HEIGHT / 2;
  const y2 = MONTH_HEADER_HEIGHT + (reading.end_day - 1) * DAY_HEIGHT + DAY_HEIGHT / 2;
  const color = COLORS[reading.color_index] ?? COLORS[0];
  const dashArray = strokeDashFor(reading.status_at_end);

  // Título acima da linha:
  //  - self_contained / starts_here: ancora no dot de início (y1).
  //  - ends_here: ancora no dot de fim (y2) — porque o livro começou em mês
  //    anterior, o "evento" deste mês é o fim. Título acima do dot de fim.
  const anchorY = reading.slice_kind === "ends_here" ? y2 : y1;
  const titleLines = wrapTitle(
    reading.title,
    TITLE_CHARS_PER_LINE,
    TITLE_MAX_LINES,
  );
  // Última linha do título fica a 4px acima do anchor; linhas anteriores
  // sobem por TITLE_LINE_HEIGHT cada.
  const titleBaselineY = anchorY - 4;
  const titleTopBaselineY =
    titleBaselineY - (titleLines.length - 1) * TITLE_LINE_HEIGHT;

  // Coords absolutas no SVG (column offset + x da lane).
  const handleMouseEnter = () => {
    onHover(reading, monthIndex, offsetX + x, y1, color);
  };

  return (
    <g onMouseEnter={handleMouseEnter} onMouseLeave={onLeave}>
      <Link
        href={`/book/${reading.book_slug}`}
        aria-label={`${reading.title} — abrir livro`}
      >
        {/* Título tingido na cor da leitura, acima do dot âncora */}
        <text
          x={x + 4}
          y={titleTopBaselineY}
          fontSize={TITLE_FONT_SIZE}
          fontWeight="500"
          fill={color}
        >
          {titleLines.map((line, i) => (
            <tspan
              key={i}
              x={x + 4}
              dy={i === 0 ? 0 : TITLE_LINE_HEIGHT}
            >
              {line}
            </tspan>
          ))}
        </text>

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

        {/* Bolinha início — anel quando ends_here (não começou aqui) */}
        {reading.slice_kind === "ends_here" ? (
          <circle
            cx={x}
            cy={y1}
            r={2.6}
            fill="var(--color-paper)"
            stroke={color}
            strokeWidth="1.4"
          />
        ) : (
          <circle cx={x} cy={y1} r={2.6} fill={color} />
        )}

        {/* Bolinha fim — círculo cheio quando finished/abandoned, anel quando
            continua ou paused */}
        {reading.status_at_end === "finished" ||
        reading.status_at_end === "abandoned" ? (
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

        {/* Seta "veio do ano anterior" — só na fatia onde a leitura entra
            no ano */}
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
      </Link>
    </g>
  );
}

// =============================================================================
// Tooltip HTML — render fora da SVG, posicionado em coords de tela com
// `position: fixed`. Mesmo vocabulário visual do tooltip da `GenrePie`:
// fundo `ink-deep`, texto ivory, acentos numéricos em `gold`.
// =============================================================================

function ReadingTooltip({ state }: { state: HoverState }) {
  const { reading, monthIndex } = state;
  const month = monthIndex + 1;
  const hasDuration = reading.duration_days != null;
  const hasPages = reading.pages_read != null;
  return (
    <div
      className="fixed pointer-events-none bg-ink-deep text-ivory rounded px-2.5 py-1.5 shadow-card z-50 whitespace-nowrap"
      style={{
        left: state.screenX,
        top: state.screenY - 10,
        // Centraliza horizontal sobre o dot e ancora pela base do tooltip
        // (sobe acima da bolinha por translateY -100%).
        transform: "translate(-50%, -100%)",
      }}
      role="status"
      aria-live="polite"
    >
      <p className="text-xs font-medium leading-tight">{reading.title}</p>
      <p className="text-[10px] leading-tight mt-1 text-paper-soft">
        <span className="text-gold tabular-nums">
          {reading.start_day}/{month}
        </span>
        <span className="opacity-60 mx-1">→</span>
        <span className="text-gold tabular-nums">
          {reading.end_day}/{month}
        </span>
        {hasDuration && (
          <>
            <span className="opacity-50 mx-1.5">·</span>
            <span className="text-gold tabular-nums">
              {reading.duration_days}
            </span>{" "}
            {reading.duration_days === 1 ? "dia" : "dias"}
          </>
        )}
        {hasPages && (
          <>
            <span className="opacity-50 mx-1.5">·</span>
            <span className="text-gold tabular-nums">{reading.pages_read}</span>{" "}
            págs
          </>
        )}
      </p>
      {reading.author_name && (
        <p className="text-[10px] leading-tight italic mt-1 text-paper-soft">
          {reading.author_name}
        </p>
      )}
    </div>
  );
}
