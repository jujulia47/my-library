"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import {
  XMarkIcon,
  PlusIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { createPurchaseGroup } from "@/actions/createPurchaseGroup";
import { updatePurchaseGroup } from "@/actions/updatePurchaseGroup";

export type PurchaseGroupOption = {
  id: string;
  name: string;
  total_price: number;
  /** Data em que o box foi adquirido. Quando setada, propaga pra todos os
   *  livros vinculados — a UX do form auto-preenche `acquired_at` ao
   *  selecionar/criar o grupo. */
  acquired_at: string | null;
  /** ISBN do BOX (diferente do ISBN do livro individual). Opcional. */
  isbn?: string | null;
  /** Quantos livros já estão no grupo (informacional). */
  book_count?: number;
};

export type PurchaseGroupSelectProps = {
  value: PurchaseGroupOption | null;
  onChange: (group: PurchaseGroupOption | null) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  /** Hidden input com o id do grupo (ou string vazia). */
  hiddenFieldName?: string;
};

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Picker de grupo de compra (box/kit). Busca grupos existentes do usuário;
 * permite criar novo inline via modal compacta (nome + valor total). Mesma
 * UX do SerieSelect.
 */
export default function PurchaseGroupSelect({
  value,
  onChange,
  label,
  placeholder = "Buscar ou criar box",
  helperText,
  errorText,
  hiddenFieldName,
}: PurchaseGroupSelectProps) {
  const reactId = useId();
  const inputId = `${reactId}-group`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<PurchaseGroupOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPrice, setCreatePrice] = useState("");
  const [createDate, setCreateDate] = useState("");
  const [createIsbn, setCreateIsbn] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // Edição inline da data do box existente. Cobre o caso de boxes que foram
  // criados antes da feature de `acquired_at` (data = null) — usuário pode
  // setar aqui sem precisar de um page dedicado.
  const [editingDate, setEditingDate] = useState(false);
  const [editDateValue, setEditDateValue] = useState("");
  const [editDateError, setEditDateError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setCreating(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!open || value || creating) return;
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/purchase-groups/search?q=${encodeURIComponent(query)}`,
        );
        if (!res.ok) {
          setMatches([]);
          return;
        }
        const json = (await res.json()) as { groups: PurchaseGroupOption[] };
        setMatches(json.groups);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, open, value, creating]);

  const select = (g: PurchaseGroupOption) => {
    onChange(g);
    setQuery("");
    setMatches([]);
    setOpen(false);
    setCreating(false);
  };

  const clear = () => {
    onChange(null);
    setEditingDate(false);
    inputRef.current?.focus();
  };

  const openEditDate = () => {
    setEditDateError(null);
    setEditDateValue(value?.acquired_at ?? "");
    setEditingDate(true);
  };

  const submitEditDate = () => {
    if (!value) return;
    setEditDateError(null);
    const newDate = editDateValue.trim() || null;
    startTransition(async () => {
      const result = await updatePurchaseGroup(value.id, {
        acquired_at: newDate,
      });
      if (result.ok) {
        // Propaga o novo `acquired_at` pra cima — OwnershipFields tem um
        // handler que sincroniza `book.acquired_at` automaticamente.
        onChange({
          ...value,
          acquired_at: result.acquired_at,
        });
        setEditingDate(false);
      } else {
        setEditDateError(result.message);
      }
    });
  };

  const openCreate = () => {
    setCreating(true);
    setCreateName(query.trim());
    setCreatePrice("");
    setCreateDate("");
    setCreateIsbn("");
    setCreateError(null);
  };

  const submitCreate = () => {
    setCreateError(null);
    const trimmedName = createName.trim();
    const priceNum = Number(createPrice);
    if (!trimmedName) {
      setCreateError("Nome obrigatório.");
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setCreateError("Valor inválido.");
      return;
    }
    const acquiredAt = createDate.trim() || null;
    const isbnValue = createIsbn.trim() || null;
    startTransition(async () => {
      const result = await createPurchaseGroup(
        trimmedName,
        priceNum,
        acquiredAt,
        isbnValue,
      );
      if (result.ok) {
        select({
          id: result.id,
          name: result.name,
          total_price: result.total_price,
          acquired_at: result.acquired_at,
          isbn: result.isbn,
          book_count: 0,
        });
      } else {
        setCreateError(result.message);
      }
    });
  };

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-body font-medium text-ink-deep"
        >
          {label}
        </label>
      )}

      <div
        className={clsx(
          "min-h-[44px] w-full rounded-md border bg-ivory-light px-3 py-2 transition-colors duration-150 flex items-center gap-2",
          errorText
            ? "border-burgundy"
            : "border-border focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20",
        )}
      >
        {value ? (
          <>
            <span className="flex-1 text-ink-deep">
              <span className="font-medium">{value.name}</span>
              <span className="ml-2 text-xs italic text-ink-fade">
                {formatBRL(value.total_price)}
              </span>
            </span>
            <button
              type="button"
              onClick={clear}
              aria-label={`Desvincular ${value.name}`}
              className="text-ink-soft hover:text-burgundy transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </>
        ) : (
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-0 outline-none text-ink-deep placeholder:text-ink-fade"
          />
        )}
      </div>

      {/* Linha inline pra mostrar/editar a data do box — só aparece quando
          há um grupo selecionado. Permite consertar boxes legados sem data
          (criados antes da feature de `acquired_at`). */}
      {value && !editingDate && (
        <div className="flex items-center gap-2 text-xs text-ink-soft">
          <CalendarDaysIcon className="w-3.5 h-3.5 text-ink-fade" aria-hidden />
          {value.acquired_at ? (
            <span>
              Data do box:{" "}
              <span className="font-medium text-ink-deep">
                {value.acquired_at.split("-").reverse().join("/")}
              </span>
            </span>
          ) : (
            <span className="italic text-ink-fade">
              Box sem data definida.
            </span>
          )}
          <button
            type="button"
            onClick={openEditDate}
            className="inline-flex items-center gap-1 text-gold-deep hover:text-ink-deep transition-colors"
          >
            <PencilSquareIcon className="w-3.5 h-3.5" />
            {value.acquired_at ? "Editar" : "Definir"}
          </button>
        </div>
      )}
      {value && editingDate && (
        <div className="rounded-md border border-gold/40 bg-gold/5 p-2 flex flex-wrap items-center gap-2 text-xs">
          <CalendarDaysIcon className="w-3.5 h-3.5 text-gold-deep" aria-hidden />
          <span className="text-ink-soft">Data do box:</span>
          <input
            type="date"
            value={editDateValue}
            onChange={(e) => setEditDateValue(e.target.value)}
            className="rounded border border-border bg-ivory-light px-2 py-1 text-xs text-ink-deep focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none"
          />
          <button
            type="button"
            onClick={submitEditDate}
            disabled={isPending}
            className="px-2 py-1 rounded bg-ink-deep text-ivory text-xs hover:bg-ink-soft transition-colors disabled:opacity-50"
          >
            {isPending ? "Salvando…" : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => setEditingDate(false)}
            className="px-2 py-1 rounded border border-border text-ink-soft hover:bg-paper transition-colors text-xs"
          >
            Cancelar
          </button>
          {editDateError && (
            <p className="w-full text-burgundy">{editDateError}</p>
          )}
        </div>
      )}

      {open && !value && !creating && (matches.length > 0 || query.trim() || loading) && (
        <div className="absolute z-30 left-0 right-0 mt-1 rounded-md border border-border bg-ivory-light shadow-lg max-h-72 overflow-auto custom-scrollbar">
          {loading && matches.length === 0 ? (
            <div className="px-3 py-2 text-sm text-ink-fade italic">
              Buscando…
            </div>
          ) : null}
          {matches.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => select(g)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-paper text-ink-deep transition-colors flex items-center justify-between gap-2"
            >
              <span className="font-medium truncate">{g.name}</span>
              <span className="text-xs italic text-ink-fade flex-shrink-0">
                {formatBRL(g.total_price)} · {g.book_count} livro
                {g.book_count !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={openCreate}
              className="w-full text-left px-3 py-2 text-sm hover:bg-paper text-ink-deep flex items-center gap-2 border-t border-border transition-colors"
            >
              <PlusIcon className="w-4 h-4 text-gold-deep" />
              <span>
                Criar box:{" "}
                <span className="italic font-medium">{query.trim()}</span>
              </span>
            </button>
          )}
        </div>
      )}

      {creating && (
        <div className="rounded-md border border-gold/40 bg-gold/5 p-3 space-y-3">
          <p className="text-xs uppercase tracking-wider text-ink-fade">
            Novo box
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-2">
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Ex.: Box Realidades Adaptadas"
              className="w-full rounded-md border border-border bg-ivory-light px-3 py-2 text-sm text-ink-deep placeholder:text-ink-fade focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={createPrice}
              onChange={(e) => setCreatePrice(e.target.value)}
              placeholder="Valor total (R$)"
              className="w-full rounded-md border border-border bg-ivory-light px-3 py-2 text-sm text-ink-deep placeholder:text-ink-fade focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-soft mb-1">
              Data de aquisição (opcional)
            </label>
            <input
              type="date"
              value={createDate}
              onChange={(e) => setCreateDate(e.target.value)}
              className="w-full sm:max-w-[200px] rounded-md border border-border bg-ivory-light px-3 py-2 text-sm text-ink-deep focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none"
            />
            <p className="text-[11px] text-ink-fade italic mt-1">
              Preenchida automaticamente em cada livro vinculado ao box.
            </p>
          </div>
          <div>
            <label className="block text-xs text-ink-soft mb-1">
              ISBN do box (opcional)
            </label>
            <input
              type="text"
              value={createIsbn}
              onChange={(e) => setCreateIsbn(e.target.value)}
              placeholder="Ex.: 978-..."
              className="w-full sm:max-w-[260px] rounded-md border border-border bg-ivory-light px-3 py-2 text-sm text-ink-deep placeholder:text-ink-fade focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none"
            />
            <p className="text-[11px] text-ink-fade italic mt-1">
              ISBN da embalagem/caixa — diferente do ISBN dos livros individuais.
            </p>
          </div>
          {createError && (
            <p className="text-xs text-burgundy">{createError}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="px-3 py-1 rounded-md border border-border text-xs text-ink-soft hover:bg-paper transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={submitCreate}
              disabled={isPending}
              className="px-3 py-1 rounded-md bg-ink-deep text-ivory text-xs hover:bg-ink-soft transition-colors disabled:opacity-50"
            >
              {isPending ? "Criando…" : "Criar"}
            </button>
          </div>
        </div>
      )}

      {hiddenFieldName && (
        <input
          type="hidden"
          name={hiddenFieldName}
          value={value?.id ?? ""}
        />
      )}

      {errorText ? (
        <p className="text-xs font-body text-burgundy">{errorText}</p>
      ) : helperText ? (
        <p className="text-xs font-body text-ink-fade">{helperText}</p>
      ) : null}
    </div>
  );
}
