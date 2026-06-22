"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

type Option = { value: string; label: string };

export type SearchableCheckboxListProps = {
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  /** Quantas opções mostrar antes do scroll começar. Default 8. */
  visibleBeforeScroll?: number;
  /** Placeholder do campo de busca. */
  searchPlaceholder?: string;
  /** Texto quando a lista de opções vinda do servidor está vazia. */
  emptyText?: string;
};

/**
 * Lista de checkboxes com busca por nome e scroll quando passar de N itens.
 *
 * - Busca cliente-side: normaliza accents/lowercase pra match flexível.
 * - Scroll: aplica `max-height` baseado em `visibleBeforeScroll` × altura
 *   média de uma linha. Resultados filtrados mantém ordem original.
 */
export default function SearchableCheckboxList({
  options,
  selected,
  onToggle,
  visibleBeforeScroll = 8,
  searchPlaceholder = "Buscar…",
  emptyText = "Nenhuma opção cadastrada.",
}: SearchableCheckboxListProps) {
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    // Normaliza pra fazer match ignorando acento.
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
    const nq = normalize(q);
    return options.filter((o) => normalize(o.label).includes(nq));
  }, [options, query]);

  if (options.length === 0) {
    return <p className="text-xs italic text-ink-fade">{emptyText}</p>;
  }

  // ~28px por linha (text-sm + padding 1.5). Multiplica pelo limite visível
  // pra calcular altura máxima do container scrollable. Quando a lista é
  // menor que o limite, o container cresce naturalmente (sem scrollbar).
  const maxHeight = `${visibleBeforeScroll * 28}px`;
  const needsScroll = filtered.length > visibleBeforeScroll;

  return (
    <div className="space-y-2">
      <div className="relative">
        <MagnifyingGlassIcon
          aria-hidden
          className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-fade pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-md border border-border bg-ivory-light pl-7 pr-7 py-1.5 text-xs text-ink-deep placeholder:text-ink-fade focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpar busca"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-ink-fade hover:text-ink-deep"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs italic text-ink-fade py-1">
          Nenhum resultado pra &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <ul
          className={needsScroll ? "overflow-y-auto custom-scrollbar pr-1" : ""}
          style={needsScroll ? { maxHeight } : undefined}
        >
          {filtered.map((o) => {
            const checked = selectedSet.has(o.value);
            return (
              <li key={o.value} className="py-0.5">
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-ink-deep w-full">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(o.value)}
                    // accent-color pinta o "miolo" do checkbox nativo com a
                    // cor de marca (chestnut). Mais leve que reescrever do
                    // zero com appearance-none e funciona consistente em
                    // todos browsers modernos.
                    className="w-4 h-4 rounded border-border accent-[#6D3914] focus:ring-2 focus:ring-[#6D3914]/30 flex-shrink-0 cursor-pointer"
                  />
                  <span className="truncate" title={o.label}>
                    {o.label}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
