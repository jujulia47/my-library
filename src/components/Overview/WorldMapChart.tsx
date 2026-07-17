"use client";

import { useState } from "react";
import { WORLD_MAP_PATHS, WORLD_MAP_VIEWBOX } from "@/utils/worldMapPaths";
import { COUNTRY_CODES, COUNTRY_LABELS } from "@/utils/countryLabels";
import type { CountryBookCount } from "@/services/overviewData";

// Escala de "calor" café: 1 livro = tom claro, máximo = marrom profundo.
const READ_COLOR = "#6D3914";
const LAND_COLOR = "#E6DDCB";
const BORDER_COLOR = "#F7F1E5";

function fillOpacity(count: number, max: number): number {
  if (max <= 1) return 0.85;
  return 0.35 + 0.55 * ((count - 1) / (max - 1));
}

type Props = {
  data: CountryBookCount[];
  /** Livros lidos sem país de autor cadastrado (nota no rodapé). */
  withoutCountry?: number;
  /** Texto da unidade: "livro lido" (default). */
  emptyMessage?: string;
};

/**
 * Mapa-múndi com os países dos autores lidos pintados por intensidade
 * (quantidade de livros), com tooltip no hover e legenda com % por país.
 */
export function WorldMapChart({
  data,
  withoutCountry = 0,
  emptyMessage = "Nenhum livro lido com país de autor cadastrado ainda.",
}: Props) {
  const [hovered, setHovered] = useState<{
    id: string;
    x: number;
    y: number;
    /** Hover veio do mapa (mostra tooltip) ou da legenda (só destaca). */
    fromMap: boolean;
  } | null>(null);

  // path id (alpha-2 minúsculo) → dados do país.
  const byCode = new Map(
    data.map((d) => [COUNTRY_CODES[d.country].toLowerCase(), d]),
  );
  const max = Math.max(...data.map((d) => d.count), 1);

  const hoveredDatum = hovered ? byCode.get(hovered.id) : null;

  if (data.length === 0) {
    return <p className="text-sm italic text-ink-fade py-4">{emptyMessage}</p>;
  }

  return (
    <div>
      <div
        className="relative"
        onMouseMove={(e) => {
          if (!hovered) return;
          const rect = e.currentTarget.getBoundingClientRect();
          setHovered((h) =>
            h ? { ...h, x: e.clientX - rect.left, y: e.clientY - rect.top } : h,
          );
        }}
      >
        <svg
          viewBox={WORLD_MAP_VIEWBOX}
          className="w-full h-auto"
          role="img"
          aria-label="Mapa dos países dos autores lidos"
        >
          {WORLD_MAP_PATHS.map((p) => {
            const datum = byCode.get(p.id);
            const isHovered = hovered?.id === p.id && datum;
            return (
              <path
                key={p.id}
                d={p.d}
                fill={datum ? READ_COLOR : LAND_COLOR}
                fillOpacity={datum ? fillOpacity(datum.count, max) : 1}
                stroke={isHovered ? "#EF9F27" : BORDER_COLOR}
                strokeWidth={isHovered ? 1.2 : 0.5}
                onMouseEnter={(e) => {
                  if (!datum) return;
                  const rect = (
                    e.currentTarget.ownerSVGElement?.parentElement as HTMLElement
                  )?.getBoundingClientRect();
                  setHovered({
                    id: p.id,
                    x: rect ? e.clientX - rect.left : 0,
                    y: rect ? e.clientY - rect.top : 0,
                    fromMap: true,
                  });
                }}
                onMouseLeave={() =>
                  setHovered((h) => (h?.id === p.id ? null : h))
                }
                style={{
                  cursor: datum ? "pointer" : "default",
                  transition: "fill-opacity 0.15s ease",
                }}
              />
            );
          })}
        </svg>

        {hovered?.fromMap && hoveredDatum && (
          <div
            className="absolute pointer-events-none bg-ink-deep text-ivory rounded px-2 py-1 shadow-card whitespace-nowrap z-10"
            style={{ left: hovered.x + 12, top: hovered.y - 8 }}
            role="status"
          >
            <span className="text-xs font-medium">
              {COUNTRY_LABELS[hoveredDatum.country]}
            </span>
            <span className="ml-1.5 text-[11px] text-gold tabular-nums">
              {hoveredDatum.count}{" "}
              {hoveredDatum.count === 1 ? "livro" : "livros"} ·{" "}
              {hoveredDatum.percent}%
            </span>
          </div>
        )}
      </div>

      {/* Legenda: % de livros lidos por país */}
      <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
        {data.map((d) => {
          const code = COUNTRY_CODES[d.country].toLowerCase();
          return (
            <li
              key={d.country}
              className={`flex items-center gap-1.5 min-w-0 rounded px-1 -mx-1 transition-colors ${
                hovered?.id === code ? "bg-paper-soft" : ""
              }`}
              onMouseEnter={() =>
                setHovered({ id: code, x: 0, y: 0, fromMap: false })
              }
              onMouseLeave={() => setHovered(null)}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: READ_COLOR,
                  opacity: fillOpacity(d.count, max),
                }}
                aria-hidden
              />
              <span className="truncate text-ink-soft">
                {COUNTRY_LABELS[d.country]}
              </span>
              <span className="ml-auto text-ink-fade tabular-nums">
                {d.count} · {d.percent}%
              </span>
            </li>
          );
        })}
      </ul>

      {withoutCountry > 0 && (
        <p className="mt-2 text-[11px] italic text-ink-fade">
          {withoutCountry}{" "}
          {withoutCountry === 1
            ? "livro lido sem país de autor cadastrado"
            : "livros lidos sem país de autor cadastrado"}
        </p>
      )}
    </div>
  );
}
