"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRightIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { BookCoverFallback } from "@/components/ui";
import { HomeCard } from "./HomeCard";
import type { NextReadItem } from "@/services/homeData";
import { addHomeNextRead } from "@/actions/addHomeNextRead";
import { removeHomeNextRead } from "@/actions/removeHomeNextRead";
import type { BookSearchOption } from "@/app/api/books/search/route";

type Props = {
  data: NextReadItem[];
};

/**
 * Carrossel de "próximas leituras" curado manualmente. Sempre exibe um slot
 * vazio "+ adicionar" no fim — sem limite de itens.
 *
 * - Cada card: capa + título + autor, link pro livro.
 * - Hover mostra × pra remover (transição otimista: some imediatamente).
 * - Slot vazio abre modal de busca dos livros do usuário.
 */
export function NextReads({ data }: Props) {
  const [items, setItems] = useState(data);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Sincroniza quando o servidor revalida (ex.: depois de outra ação na home).
  useEffect(() => {
    setItems(data);
  }, [data]);

  const handleRemove = async (entryId: string) => {
    // Otimismo: remove da UI antes da action confirmar.
    const before = items;
    setItems((prev) => prev.filter((it) => it.entry_id !== entryId));
    const result = await removeHomeNextRead(entryId);
    if (!result.ok) {
      // Reverte em caso de erro.
      setItems(before);
    }
  };

  const handleAdd = async (book: BookSearchOption): Promise<boolean> => {
    const result = await addHomeNextRead(book.id);
    if (!result.ok) return false;
    // Adiciona imediatamente — o item completo virá no próximo refresh.
    // Inserção otimista usa o que temos (sem author/cover); na próxima
    // navegação ou refresh, vem o registro completo do servidor.
    setItems((prev) => [
      ...prev,
      {
        entry_id: result.data?.id ?? `temp-${book.id}`,
        id: book.id,
        slug: book.slug,
        title: book.title,
        author_name: null,
        cover_url: null,
      },
    ]);
    return true;
  };

  return (
    <HomeCard
      title="Próximas leituras"
      icon={<ArrowRightIcon className="w-3.5 h-3.5" />}
    >
      <div
        // `custom-scrollbar` (definida em globals.css): scrollbar fina,
        // track transparente, thumb na cor border-bege. Consistente com
        // outros containers scrollable do app.
        className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar"
      >
        {items.map((item) => (
          <NextReadCard
            key={item.entry_id}
            item={item}
            onRemove={() => handleRemove(item.entry_id)}
          />
        ))}
        <EmptySlot onClick={() => setPickerOpen(true)} />
      </div>

      {pickerOpen && (
        <BookPickerModal
          existingBookIds={new Set(items.map((i) => i.id))}
          onClose={() => setPickerOpen(false)}
          onPick={handleAdd}
        />
      )}
    </HomeCard>
  );
}

function NextReadCard({
  item,
  onRemove,
}: {
  item: NextReadItem;
  onRemove: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <div className="relative group flex-shrink-0 w-[88px]">
      <Link
        href={`/book/${item.slug}`}
        className="block hover:-translate-y-px transition-transform duration-150"
      >
        <div
          className="w-full relative shadow-sm rounded overflow-hidden border border-ink-deep/15"
          style={{ aspectRatio: "2 / 3" }}
          aria-hidden
        >
          {item.cover_url ? (
            <Image
              src={item.cover_url}
              alt=""
              fill
              className="object-cover"
              sizes="88px"
            />
          ) : (
            <BookCoverFallback
              title={item.title}
              size="sm"
              className="w-full h-full"
            />
          )}
        </div>
        <p className="mt-1.5 text-xs font-medium text-ink-deep leading-snug line-clamp-2 group-hover:text-gold-deep transition-colors">
          {item.title}
        </p>
        {item.author_name && (
          <p className="text-[10px] italic text-ink-fade leading-tight truncate">
            {item.author_name}
          </p>
        )}
      </Link>
      {/* X dentro da capa (top-1 right-1) — antes extravasava com -top/-right
          negativo e era cortado pelo `overflow-x-auto` do carrossel. */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          startTransition(onRemove);
        }}
        disabled={isPending}
        className={clsx(
          "absolute top-1 right-1 w-5 h-5 rounded-full bg-ivory-light/95 border border-border",
          "flex items-center justify-center text-ink-soft hover:text-burgundy hover:border-burgundy",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "shadow-sm backdrop-blur-[2px]",
        )}
        title="Remover de Próximas leituras"
        aria-label={`Remover ${item.title} de Próximas leituras`}
      >
        <XMarkIcon className="w-3 h-3" />
      </button>
    </div>
  );
}

function EmptySlot({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex-shrink-0 w-[88px] flex flex-col items-center justify-start",
        "text-ink-fade hover:text-gold-deep transition-colors group",
      )}
      title="Adicionar livro"
      aria-label="Adicionar livro a Próximas leituras"
    >
      <div
        className={clsx(
          "w-full rounded border-2 border-dashed border-border",
          "flex items-center justify-center",
          "group-hover:border-roasted-chestnut group-hover:bg-gold/5 transition-colors",
        )}
        style={{ aspectRatio: "2 / 3" }}
      >
        <PlusIcon className="w-6 h-6" />
      </div>
      <p className="mt-1.5 text-xs italic leading-snug">adicionar</p>
    </button>
  );
}

/**
 * Modal de busca de livros do user pra adicionar à curadoria. Reusa
 * `/api/books/search` com debounce. Esconde livros já na lista.
 */
function BookPickerModal({
  existingBookIds,
  onClose,
  onPick,
}: {
  existingBookIds: Set<string>;
  onClose: () => void;
  onPick: (book: BookSearchOption) => Promise<boolean>;
}) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Autofocus quando abre.
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    setIsLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const url = `/api/books/search?q=${encodeURIComponent(query.trim())}`;
        const res = await fetch(url);
        if (!res.ok) {
          setResults([]);
          return;
        }
        const json = (await res.json()) as { books?: BookSearchOption[] };
        setResults(json.books ?? []);
      } finally {
        setIsLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Esc fecha o modal.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handlePick = async (book: BookSearchOption) => {
    setIsAdding(true);
    const ok = await onPick(book);
    setIsAdding(false);
    if (ok) onClose();
  };

  const filtered = results.filter((b) => !existingBookIds.has(b.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-ink-deep/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-ivory-light rounded-lg shadow-xl border border-border p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-ink-deep">
            Adicionar a Próximas leituras
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-fade hover:text-ink-deep"
            aria-label="Fechar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-fade" />
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar livro pelo título…"
            className={clsx(
              "w-full rounded-md bg-paper-soft text-ink-deep placeholder:text-ink-fade",
              "border border-border focus:border-gold focus:ring-2 focus:ring-gold/20",
              "pl-9 pr-3 py-2 text-sm font-body outline-none transition-colors",
            )}
          />
        </div>

        <ul className="mt-3 max-h-72 overflow-y-auto divide-y divide-paper-soft">
          {isLoading && filtered.length === 0 && (
            <li className="py-3 text-xs italic text-ink-fade text-center">
              Buscando…
            </li>
          )}
          {!isLoading && filtered.length === 0 && (
            <li className="py-3 text-xs italic text-ink-fade text-center">
              {query.trim()
                ? "Nenhum livro encontrado."
                : "Comece digitando…"}
            </li>
          )}
          {filtered.map((book) => (
            <li key={book.id}>
              <button
                type="button"
                onClick={() => handlePick(book)}
                disabled={isAdding}
                className={clsx(
                  "w-full text-left px-2 py-2 text-sm text-ink-deep",
                  "hover:bg-paper-soft transition-colors rounded",
                  "disabled:opacity-50",
                )}
              >
                {book.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
