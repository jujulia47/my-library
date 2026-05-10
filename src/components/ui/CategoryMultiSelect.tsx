"use client";

import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import { XMarkIcon } from "@heroicons/react/24/outline";
import QuickCategoryModal from "@/components/forms/QuickCategoryModal";

export type CategoryOption = { id: string; name: string };

export type CategoryMultiSelectProps = {
  value: CategoryOption[];
  onChange: (categories: CategoryOption[]) => void;
  options: CategoryOption[];
  placeholder?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  hiddenFieldName?: string;
  /**
   * Reporta validade pro form pai. Inválido quando há texto digitado que não
   * corresponde a nenhuma categoria existente (e não está vazio).
   */
  onValidationChange?: (isValid: boolean) => void;
};

export default function CategoryMultiSelect({
  value,
  onChange,
  options,
  placeholder = "Adicionar categoria",
  label,
  helperText,
  errorText,
  hiddenFieldName,
  onValidationChange,
}: CategoryMultiSelectProps) {
  const reactId = useId();
  const inputId = `${reactId}-cat`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmed = query.trim();
  const hasExactMatch =
    trimmed.length > 0 &&
    options.some((o) => o.name.toLowerCase() === trimmed.toLowerCase());
  const showInlineError = trimmed.length > 0 && !hasExactMatch;
  const isValid = !showInlineError;

  // Reporta validade pro form pai sempre que mudar.
  useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  if (options.length === 0) {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-body font-medium text-ink-deep">
            {label}
          </label>
        )}
        <div className="rounded-md border border-dashed border-border bg-paper-soft/40 px-4 py-6 text-center">
          <p className="text-sm text-ink-soft">
            Você ainda não tem categorias.{" "}
            <Link
              href="/category"
              className="text-gold-deep underline hover:text-ink-deep transition-colors"
            >
              Criar agora
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const selectedIds = new Set(value.map((c) => c.id));
  const lowerQuery = trimmed.toLowerCase();
  const filtered = options.filter(
    (o) =>
      !selectedIds.has(o.id) &&
      (lowerQuery === "" || o.name.toLowerCase().includes(lowerQuery)),
  );

  const addCategory = (cat: CategoryOption) => {
    if (selectedIds.has(cat.id)) return;
    onChange([...value, cat]);
    setQuery("");
    inputRef.current?.focus();
  };

  const removeCategory = (id: string) => {
    onChange(value.filter((c) => c.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[0] && hasExactMatch) {
        const exact = filtered.find(
          (o) => o.name.toLowerCase() === trimmed.toLowerCase(),
        );
        if (exact) addCategory(exact);
      } else if (filtered[0]) {
        addCategory(filtered[0]);
      }
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      removeCategory(value[value.length - 1].id);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <>
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
            "min-h-[44px] w-full rounded-md border bg-ivory-light px-2 py-1.5 transition-colors duration-150",
            errorText || showInlineError
              ? "border-burgundy"
              : "border-border focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20",
          )}
        >
          <div className="flex flex-wrap gap-1.5 items-center">
            {value.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 rounded-full border border-olive/35 bg-olive/[0.18] px-2.5 py-0.5 text-sm text-olive"
              >
                {c.name}
                <button
                  type="button"
                  onClick={() => removeCategory(c.id)}
                  aria-label={`Remover ${c.name}`}
                  className="text-olive/70 hover:text-burgundy transition-colors"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={value.length === 0 ? placeholder : ""}
              className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-ink-deep placeholder:text-ink-fade px-1.5 py-1"
            />
          </div>
        </div>

        {open && filtered.length > 0 && (
          <div className="absolute z-30 left-0 right-0 mt-1 rounded-md border border-border bg-ivory-light shadow-lg max-h-60 overflow-auto custom-scrollbar">
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => addCategory(c)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-paper text-ink-deep transition-colors"
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {hiddenFieldName &&
          value.map((c) => (
            <input
              key={c.id}
              type="hidden"
              name={hiddenFieldName}
              value={c.id}
            />
          ))}

        {showInlineError ? (
          <div className="space-y-1.5">
            <p className="text-sm text-burgundy">
              A categoria{" "}
              <span className="italic">&ldquo;{trimmed}&rdquo;</span> não existe
              na sua lista.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setQuickOpen(true)}
                className="text-sm text-gold-deep hover:text-ink-deep underline transition-colors"
              >
                + Criar essa categoria
              </button>
              <span className="text-xs text-ink-fade italic">
                ou{" "}
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="underline hover:text-ink-deep transition-colors"
                >
                  apague o texto
                </button>
              </span>
            </div>
          </div>
        ) : errorText ? (
          <p className="text-xs font-body text-burgundy">{errorText}</p>
        ) : helperText ? (
          <p className="text-xs font-body text-ink-fade">{helperText}</p>
        ) : null}
      </div>

      <QuickCategoryModal
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        initialName={trimmed}
        onCreated={(cat) => {
          // Adiciona ao state e limpa input.
          onChange([...value, cat]);
          setQuery("");
        }}
      />
    </>
  );
}
