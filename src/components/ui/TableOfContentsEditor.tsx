"use client";

import { useEffect, useState } from "react";
import { PlusIcon, XMarkIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui";

export type TocItem = { title: string; page_start: number | null };

export type TableOfContentsEditorProps = {
  initial: TocItem[];
  /** Nome do campo hidden que recebe a versão JSON.stringified. */
  hiddenFieldName: string;
  label?: string;
  helperText?: string;
};

/**
 * Editor de lista dinâmica de itens `{ title, page_start }`. Pra coletâneas
 * de contos ou edições com sumário customizado. Sincroniza state local com
 * um input hidden em JSON pra a action consumir.
 */
export default function TableOfContentsEditor({
  initial,
  hiddenFieldName,
  label,
  helperText,
}: TableOfContentsEditorProps) {
  const [items, setItems] = useState<TocItem[]>(initial);
  const [serialized, setSerialized] = useState(JSON.stringify(initial));

  useEffect(() => {
    setSerialized(JSON.stringify(items));
  }, [items]);

  const addItem = () => {
    setItems((prev) => [...prev, { title: "", page_start: null }]);
  };

  const updateItem = (idx: number, patch: Partial<TocItem>) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="text-sm font-body font-medium text-ink-deep">
          {label}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-xs italic text-ink-fade py-2">
          Nenhum item adicionado.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 rounded-md border border-border bg-paper/40 p-2"
            >
              <button
                type="button"
                onClick={() => moveUp(idx)}
                aria-label={`Mover ${item.title || "item"} pra cima`}
                disabled={idx === 0}
                className="mt-2 text-ink-fade hover:text-ink-deep transition-colors disabled:opacity-30"
                title="Mover pra cima"
              >
                <Bars3Icon className="w-4 h-4" />
              </button>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-2">
                <Input
                  aria-label={`Título do item ${idx + 1}`}
                  value={item.title}
                  onChange={(e) =>
                    updateItem(idx, { title: e.target.value })
                  }
                  placeholder="Nome do conto/capítulo"
                />
                <Input
                  aria-label={`Página inicial do item ${idx + 1}`}
                  type="number"
                  min="1"
                  value={item.page_start ?? ""}
                  onChange={(e) =>
                    updateItem(idx, {
                      page_start: e.target.value
                        ? Number(e.target.value) || null
                        : null,
                    })
                  }
                  placeholder="Pág."
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                aria-label={`Remover ${item.title || "item"}`}
                className="mt-2 text-ink-soft hover:text-burgundy transition-colors"
                title="Remover"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-1.5 text-sm text-gold-deep hover:text-ink-deep transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        Adicionar item
      </button>

      <input type="hidden" name={hiddenFieldName} value={serialized} />

      {helperText && (
        <p className="text-xs font-body text-ink-fade">{helperText}</p>
      )}
    </div>
  );
}
