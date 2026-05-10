"use client";

import { useMemo } from "react";
import type { HomeHeatmap } from "@/services/homeData";

const MONTHS_PT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const FULL_MONTHS_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

// Tom mais claro e neutro pra dias sem progresso. Mantemos o `paper-soft`
// pra ficar consistente com superfícies do design system.
const EMPTY_COLOR = "var(--color-paper-soft)";
const FUTURE_COLOR = "var(--color-paper-soft)";

const SCALE: { threshold: number; color: string }[] = [
  { threshold: 30, color: "#FAC775" }, // gold-soft (1-30)
  { threshold: 60, color: "#EF9F27" }, // gold (31-60)
  { threshold: 100, color: "#BA7517" }, // gold-deep (61-100)
  { threshold: Infinity, color: "#854F0B" }, // gold-deepest (101+)
];

function getColorForPages(pages: number, isFuture: boolean): string {
  if (isFuture) return FUTURE_COLOR;
  if (pages <= 0) return EMPTY_COLOR;
  for (const step of SCALE) {
    if (pages <= step.threshold) return step.color;
  }
  return SCALE[SCALE.length - 1].color;
}

function formatTooltip(iso: string, pages: number): string {
  const d = new Date(`${iso}T00:00:00`);
  const day = d.getDate();
  const month = FULL_MONTHS_PT[d.getMonth()];
  const pagesLabel =
    pages === 0
      ? "sem leitura"
      : `${pages} ${pages === 1 ? "página" : "páginas"}`;
  return `${day} de ${month} · ${pagesLabel}`;
}

const CELL_SIZE = 12;
const CELL_GAP = 2;
const CELL_PITCH = CELL_SIZE + CELL_GAP;

type Props = {
  data: HomeHeatmap;
  year: number;
};

export function ReadingHeatmap({ data, year }: Props) {
  // Computamos uma vez os "leading empties" (dias da semana antes de 1/jan
  // que não pertencem ao ano), os índices de coluna onde cada mês começa,
  // e o número total de colunas. `weekDay` 0 = domingo (padrão JS).
  const layout = useMemo(() => {
    const firstWeekDay = new Date(year, 0, 1).getDay();
    const lastWeekDay = new Date(year, 11, 31).getDay();
    const trailingEmpties = 6 - lastWeekDay;
    const totalCells =
      firstWeekDay + data.cells.length + trailingEmpties;
    const totalColumns = totalCells / 7;

    const monthStartColumns: { month: number; column: number }[] = [];
    for (let m = 0; m < 12; m += 1) {
      const dayIndex = data.cells.findIndex((c) => {
        const d = new Date(`${c.date}T00:00:00`);
        return d.getMonth() === m && d.getDate() === 1;
      });
      if (dayIndex >= 0) {
        const absoluteIdx = firstWeekDay + dayIndex;
        const column = Math.floor(absoluteIdx / 7);
        monthStartColumns.push({ month: m, column });
      }
    }

    return {
      firstWeekDay,
      trailingEmpties,
      totalColumns,
      monthStartColumns,
    };
  }, [year, data.cells]);

  const todayISO = useMemo(() => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const d = String(t.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  return (
    <div className="font-body">
      {/* Container rolável horizontalmente em mobile. Em desktop, o heatmap
          do ano todo cabe sem scroll na maioria dos viewports (~53 colunas
          × 14px ≈ 742px); telas estreitas viram scroll interno. */}
      <div className="overflow-x-auto custom-scrollbar -mx-1 px-1 pb-1">
        <div className="inline-flex flex-col">
          {/* Linha de meses no topo */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `26px repeat(${layout.totalColumns}, ${CELL_SIZE}px)`,
              columnGap: `${CELL_GAP}px`,
              marginBottom: "4px",
              fontSize: "9px",
              color: "var(--color-ink-fade)",
            }}
          >
            <span />
            {layout.monthStartColumns.map(({ month, column }) => (
              <span
                key={month}
                style={{
                  // Grid columns são 1-based. +2 porque a primeira coluna é
                  // ocupada pela faixa de labels de dia.
                  gridColumn: `${column + 2} / span 4`,
                  textAlign: "left",
                  whiteSpace: "nowrap",
                }}
              >
                {MONTHS_PT[month]}
              </span>
            ))}
          </div>

          {/* Corpo: labels de dia + grid de células */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `26px repeat(${layout.totalColumns}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
              columnGap: `${CELL_GAP}px`,
              rowGap: `${CELL_GAP}px`,
            }}
          >
            {/* Labels de dia da semana (coluna 1, alternados pra economizar
                espaço — Seg/Qua/Sex visíveis como no GitHub). */}
            {[
              { row: 1, label: "Seg" },
              { row: 3, label: "Qua" },
              { row: 5, label: "Sex" },
            ].map(({ row, label }) => (
              <span
                key={label}
                style={{
                  gridRow: row + 1,
                  gridColumn: 1,
                  fontSize: "9px",
                  color: "var(--color-ink-fade)",
                  alignSelf: "center",
                  lineHeight: 1,
                }}
              >
                {label}
              </span>
            ))}

            {/* Células do ano. Cada uma ancorada explicitamente em (row, col)
                pra evitar bugs de auto-flow + leading empties. Sessão 17.10:
                dot moss no canto top-right quando houve livro finalizado. */}
            {data.cells.map((cell, idx) => {
              const absoluteIdx = layout.firstWeekDay + idx;
              const row = (absoluteIdx % 7) + 1;
              const column = Math.floor(absoluteIdx / 7) + 2;
              const isFuture = cell.date > todayISO;
              const isToday = cell.date === todayISO;
              const animationDelayMs = (column - 2) * 18;
              const finishedTooltip =
                cell.finished_books > 0
                  ? ` · ${cell.finished_books} livro${cell.finished_books > 1 ? "s" : ""} finalizado${cell.finished_books > 1 ? "s" : ""}`
                  : "";
              return (
                <div
                  key={cell.date}
                  title={
                    formatTooltip(cell.date, cell.pages_delta) + finishedTooltip
                  }
                  className={isToday ? "heatmap-cell-today" : undefined}
                  style={{
                    gridRow: row,
                    gridColumn: column,
                    backgroundColor: getColorForPages(
                      cell.pages_delta,
                      isFuture,
                    ),
                    opacity: isFuture ? 0.35 : 1,
                    borderRadius: "2px",
                    cursor:
                      cell.pages_delta > 0 || cell.finished_books > 0
                        ? "pointer"
                        : "default",
                    animation: `cellFadeIn 0.4s ease-out ${animationDelayMs}ms backwards`,
                    position: "relative",
                  }}
                >
                  {cell.finished_books > 0 && (
                    <span
                      aria-label={`${cell.finished_books} livro${cell.finished_books > 1 ? "s" : ""} finalizado${cell.finished_books > 1 ? "s" : ""}`}
                      style={{
                        position: "absolute",
                        top: 1,
                        right: 1,
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        backgroundColor: "var(--color-moss)",
                        boxShadow: "0 0 2px rgba(0,0,0,0.3)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer: stats + escala visual */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
        <p className="text-[11px] italic text-ink-fade">
          {data.total_pages.toLocaleString("pt-BR")}{" "}
          {data.total_pages === 1 ? "página" : "páginas"} em{" "}
          {data.total_days_with_progress}{" "}
          {data.total_days_with_progress === 1 ? "dia" : "dias"} · média{" "}
          {data.average_pages_per_day.toString().replace(".", ",")} pág/dia
        </p>
        <div className="flex items-center gap-1.5 text-[9px] text-ink-fade">
          <span>menos</span>
          <span
            style={{
              width: 10,
              height: 10,
              backgroundColor: EMPTY_COLOR,
              borderRadius: 2,
              display: "inline-block",
            }}
          />
          {SCALE.map((step) => (
            <span
              key={step.color}
              style={{
                width: 10,
                height: 10,
                backgroundColor: step.color,
                borderRadius: 2,
                display: "inline-block",
              }}
            />
          ))}
          <span>mais</span>
        </div>
      </div>
    </div>
  );
}

// Pitch usado externamente caso outro componente queira posicionar marcadores
// em sincronia com a grade. Exportado pra evitar duplicar a constante.
export const HEATMAP_CELL_PITCH = CELL_PITCH;
