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
const MONTH_HEADER_HEIGHT = 64;
const DAY_HEIGHT = 18;
const DAYS_TOTAL = 31;
// Bottom padding generoso pra acomodar o lane stagger (até ~32px na lane 2).
const TOTAL_HEIGHT = MONTH_HEADER_HEIGHT + DAYS_TOTAL * DAY_HEIGHT + 48;
const PADDING_X = 32;
const READING_X_BASE = PADDING_X + 6;
const LANE_OFFSET = 20;
const LANE_LABEL_Y_STAGGER = 16;
const LABEL_X_GAP = 10;

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
  const lanes = assignLanes(month.readings);
  const monthName = MONTH_NAMES_PT[month.month - 1];

  const totalDays = daysInMonth(year, month.month - 1);

  const maxLane =
    month.readings.length > 0
      ? Math.max(...Array.from(lanes.values()))
      : 0;
  const labelX = READING_X_BASE + (maxLane + 1) * LANE_OFFSET + LABEL_X_GAP;
  const labelMaxChars = Math.max(
    12,
    Math.floor((monthWidth - labelX - 6) / 6.5),
  );

  // Stagger vertical do label — separado da lane horizontal. Lane é
  // calculada por overlap temporal (assignLanes) e governa onde a LINHA fica
  // (eixo X); usar lane também pro stagger Y do label faz uma leitura
  // sozinha no dia 31 mas em lane 2 (porque leituras anteriores no mês
  // ocupavam lanes 0 e 1) receber +32px de stagger, jogando o label bem
  // abaixo do dia 31 — bug reportado pela usuária. Solução: agrupar por
  // start_day e estagar apenas entre leituras que começam no MESMO dia.
  const labelOffsets = new Map<string, number>();
  const groupedByStart = new Map<number, TimelineReading[]>();
  for (const r of month.readings) {
    const list = groupedByStart.get(r.start_day) ?? [];
    list.push(r);
    groupedByStart.set(r.start_day, list);
  }
  for (const list of groupedByStart.values()) {
    list.sort((a, b) => a.reading_id.localeCompare(b.reading_id));
    list.forEach((r, idx) => labelOffsets.set(r.reading_id, idx));
  }
  // Bordas do grid de dias — usadas pra decidir se o stagger vai pra baixo
  // (default, mais natural de ler) ou se precisa virar pra cima quando a
  // leitura está nos últimos dias do mês e o stagger transbordaria.
  const gridTop = MONTH_HEADER_HEIGHT;
  const gridBottom = MONTH_HEADER_HEIGHT + totalDays * DAY_HEIGHT;

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

      {month.readings.map((r) => (
        <ReadingLine
          key={`${r.reading_id}-${month.month}`}
          reading={r}
          lane={lanes.get(r.reading_id) ?? 0}
          labelOffset={labelOffsets.get(r.reading_id) ?? 0}
          gridTop={gridTop}
          gridBottom={gridBottom}
          monthIndex={month.month - 1}
          labelX={labelX}
          labelMaxChars={labelMaxChars}
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
  labelOffset,
  gridTop,
  gridBottom,
  monthIndex,
  labelX,
  labelMaxChars,
  offsetX,
  onHover,
  onLeave,
}: {
  reading: TimelineReading;
  lane: number;
  /** Índice 0-based dentro do grupo de leituras com o mesmo `start_day` — só
   *  estagara verticalmente quando há colisão real de labels no mesmo dia. */
  labelOffset: number;
  gridTop: number;
  gridBottom: number;
  monthIndex: number;
  labelX: number;
  labelMaxChars: number;
  offsetX: number;
  onHover: ReadingHoverHandler;
  onLeave: () => void;
}) {
  const x = READING_X_BASE + lane * LANE_OFFSET;
  const y1 = MONTH_HEADER_HEIGHT + (reading.start_day - 1) * DAY_HEIGHT + DAY_HEIGHT / 2;
  const y2 = MONTH_HEADER_HEIGHT + (reading.end_day - 1) * DAY_HEIGHT + DAY_HEIGHT / 2;
  const color = COLORS[reading.color_index] ?? COLORS[0];
  const dashArray = strokeDashFor(reading.status_at_end);

  // Posição Y do label: para offset 0 (única leitura naquele start_day),
  // alinha exatamente na linha do dia. Para offsets >0 (colisão), tenta
  // descer; se o downward transbordaria o grid do mês, vira pra cima.
  const labelYTitle = (() => {
    const naturalY = y1 + 6;
    if (labelOffset === 0) return naturalY;
    const downward = naturalY + labelOffset * LANE_LABEL_Y_STAGGER;
    if (downward <= gridBottom - 2) return downward;
    const upward = y1 - 6 - labelOffset * LANE_LABEL_Y_STAGGER;
    if (upward >= gridTop + 4) return upward;
    // Ambas direções extrapolam → cap no grid (best effort, raro na prática).
    return Math.min(gridBottom - 2, Math.max(gridTop + 4, downward));
  })();
  const titleShort =
    reading.title.length > labelMaxChars
      ? `${reading.title.slice(0, labelMaxChars - 1)}…`
      : reading.title;

  // Coords absolutas no SVG (column offset + x da lane).
  const handleMouseEnter = () => {
    onHover(reading, monthIndex, offsetX + x, y1, color);
  };

  return (
    <g
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
    >
      {/* <title> nativo do browser foi removido em favor do tooltip HTML
          custom renderizado pelo TimelineChunkSvg. A acessibilidade
          continua coberta pelo aria-label do Link abaixo. */}
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

        {/* Conector horizontal sutil ligando o dot de início à entrada do
            label — reforça a associação visual quando há várias lanes. */}
        <line
          x1={x + 3}
          y1={labelYTitle - 3}
          x2={labelX - 3}
          y2={labelYTitle - 3}
          stroke={color}
          strokeWidth="0.6"
          opacity="0.4"
        />

        {/* Título tingido na cor da leitura */}
        <text
          x={labelX}
          y={labelYTitle}
          fontSize="13"
          fontWeight="500"
          fill={color}
        >
          {titleShort}
        </text>
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
