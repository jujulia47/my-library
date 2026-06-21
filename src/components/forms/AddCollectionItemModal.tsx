"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CheckIcon } from "@heroicons/react/24/outline";
import Modal from "./Modal";
import { Input, Textarea, Button, BookCoverFallback } from "@/components/ui";
import { imagesUrl } from "@/services/images";
import { addCollectionItem } from "@/actions/addCollectionItem";
import { createWishlistInline } from "@/actions/createWishlistInline";
import type { BookForCollectionOption } from "@/app/api/books/search-for-collection/route";
import type { WishlistForCollectionOption } from "@/app/api/wishlist/search-for-collection/route";
import type { Database } from "@/utils/typings/supabase";

type CollectionType = Database["public"]["Enums"]["collection_type"];
type Tab = "book" | "wishlist" | "new_wishlist";

const MAX_BATCH = 50;

export type AddCollectionItemModalProps = {
  open: boolean;
  onClose: () => void;
  collectionId: string;
  collectionSlug: string;
  /** Tipo da coleção — controla quais tabs aparecem. */
  collectionType: CollectionType;
  /** Pré-preenche a seção do novo item (quando aberto pelo "+ adicionar" do header de seção). */
  defaultSection?: string | null;
};

export default function AddCollectionItemModal({
  open,
  onClose,
  collectionId,
  collectionSlug: _collectionSlug,
  collectionType,
  defaultSection = null,
}: AddCollectionItemModalProps) {
  const router = useRouter();
  const isWishlistCollection = collectionType === "wishlist";
  const defaultTab: Tab = isWishlistCollection ? "wishlist" : "book";
  const [tab, setTab] = useState<Tab>(defaultTab);

  // Search state — agora multi-select nas duas tabs de busca.
  const [query, setQuery] = useState("");
  const [bookResults, setBookResults] = useState<BookForCollectionOption[]>([]);
  const [wishlistResults, setWishlistResults] = useState<
    WishlistForCollectionOption[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [selectedWishlistIds, setSelectedWishlistIds] = useState<string[]>([]);

  // "Memória" das seleções: precisamos exibir items selecionados que não
  // estão mais nos resultados da busca atual (ex: usuário busca "harry",
  // seleciona 2, depois busca "tolkien" — os 2 anteriores ainda contam).
  const [bookCache, setBookCache] = useState<
    Record<string, BookForCollectionOption>
  >({});
  const [wishlistCache, setWishlistCache] = useState<
    Record<string, WishlistForCollectionOption>
  >({});

  // Section autocomplete.
  const [sections, setSections] = useState<string[]>([]);
  const [section, setSection] = useState(defaultSection ?? "");

  // New wishlist form state (single — não é multi).
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "">(
    "",
  );
  const [newNotes, setNewNotes] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const debounceRef = useRef<number | null>(null);

  // Reset on open.
  useEffect(() => {
    if (!open) return;
    setTab(defaultTab);
    setQuery("");
    setBookResults([]);
    setWishlistResults([]);
    setSelectedBookIds([]);
    setSelectedWishlistIds([]);
    setBookCache({});
    setWishlistCache({});
    setSection(defaultSection ?? "");
    setNewTitle("");
    setNewAuthor("");
    setNewLink("");
    setNewPrice("");
    setNewPriority("");
    setNewNotes("");
    setFieldErrors({});
    setGenericError(null);
    setBatchError(null);
  }, [open, defaultSection, defaultTab]);

  // Fetch sections of this collection (autocomplete).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/collections/${collectionId}/sections`);
      if (!res.ok) return;
      const json = (await res.json()) as { sections: string[] };
      if (!cancelled) setSections(json.sections);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, collectionId]);

  // Debounced search.
  useEffect(() => {
    if (!open) return;
    if (tab === "new_wishlist") return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true);
      try {
        if (tab === "book") {
          const url = `/api/books/search-for-collection?q=${encodeURIComponent(query)}&exclude_collection_id=${collectionId}`;
          const res = await fetch(url);
          if (res.ok) {
            const json = (await res.json()) as {
              books: BookForCollectionOption[];
            };
            setBookResults(json.books);
            // Atualiza cache pra preservar items selecionados que não estão
            // mais nos resultados.
            setBookCache((prev) => {
              const next = { ...prev };
              for (const b of json.books) next[b.id] = b;
              return next;
            });
          } else {
            setBookResults([]);
          }
        } else {
          const url = `/api/wishlist/search-for-collection?q=${encodeURIComponent(query)}&exclude_collection_id=${collectionId}`;
          const res = await fetch(url);
          if (res.ok) {
            const json = (await res.json()) as {
              items: WishlistForCollectionOption[];
            };
            setWishlistResults(json.items);
            setWishlistCache((prev) => {
              const next = { ...prev };
              for (const w of json.items) next[w.id] = w;
              return next;
            });
          } else {
            setWishlistResults([]);
          }
        }
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, tab, open, collectionId]);

  const switchTab = (next: Tab) => {
    setTab(next);
    setQuery("");
    setBookResults([]);
    setWishlistResults([]);
    setSelectedBookIds([]);
    setSelectedWishlistIds([]);
    setFieldErrors({});
    setGenericError(null);
    setBatchError(null);
  };

  // Toggle de seleção respeitando MAX_BATCH.
  const toggleBookSelection = (id: string) => {
    setBatchError(null);
    setSelectedBookIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_BATCH) {
        setBatchError(
          `Limite de ${MAX_BATCH} itens por vez. Adicione em batches.`,
        );
        return prev;
      }
      return [...prev, id];
    });
  };

  const toggleWishlistSelection = (id: string) => {
    setBatchError(null);
    setSelectedWishlistIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_BATCH) {
        setBatchError(
          `Limite de ${MAX_BATCH} itens por vez. Adicione em batches.`,
        );
        return prev;
      }
      return [...prev, id];
    });
  };

  const clearSelection = () => {
    if (tab === "book") setSelectedBookIds([]);
    else if (tab === "wishlist") setSelectedWishlistIds([]);
    setBatchError(null);
  };

  const currentSelection = useMemo(
    () => (tab === "book" ? selectedBookIds : selectedWishlistIds),
    [tab, selectedBookIds, selectedWishlistIds],
  );

  // Submit em loop client-side. Sucesso total fecha; sucesso parcial mantém
  // modal aberto com falhos ainda selecionados pra retry.
  const submitBatch = async () => {
    if (currentSelection.length === 0) return;
    setGenericError(null);
    setBatchError(null);
    startTransition(async () => {
      const failed: string[] = [];
      let lastErrorMessage = "";
      for (const id of currentSelection) {
        const params =
          tab === "book"
            ? { collection_id: collectionId, book_id: id }
            : { collection_id: collectionId, wishlist_id: id };
        const result = await addCollectionItem({
          ...params,
          section: section.trim() || null,
        });
        if (!result.ok) {
          failed.push(id);
          lastErrorMessage = result.message;
        }
      }
      const successCount = currentSelection.length - failed.length;
      router.refresh();
      if (failed.length === 0) {
        onClose();
        return;
      }
      // Sucesso parcial: mantém modal aberto com falhos selecionados.
      if (tab === "book") setSelectedBookIds(failed);
      else setSelectedWishlistIds(failed);
      setBatchError(
        successCount > 0
          ? `${successCount} ${successCount === 1 ? "item adicionado" : "itens adicionados"} · ${failed.length} ${failed.length === 1 ? "item não pôde ser adicionado" : "itens não puderam ser adicionados"}${lastErrorMessage ? ` (${lastErrorMessage})` : ""}.`
          : `Nenhum item foi adicionado${lastErrorMessage ? ` (${lastErrorMessage})` : ""}.`,
      );
    });
  };

  const submitNewWishlist = () => {
    setFieldErrors({});
    setGenericError(null);
    if (!newTitle.trim()) {
      setFieldErrors({ title: "Título obrigatório." });
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", newTitle);
      if (newAuthor.trim()) fd.set("author_name", newAuthor);
      if (newLink.trim()) fd.set("purchase_link", newLink);
      if (newPrice.trim()) fd.set("estimated_price", newPrice);
      if (newPriority) fd.set("priority", newPriority);
      if (newNotes.trim()) fd.set("notes", newNotes);

      const created = await createWishlistInline(fd);
      if (!created.ok) {
        if (created.field) setFieldErrors({ [created.field]: created.message });
        else setGenericError(created.message);
        return;
      }
      const added = await addCollectionItem({
        collection_id: collectionId,
        wishlist_id: created.id,
        section: section.trim() || null,
      });
      if (!added.ok) {
        setGenericError(
          `${added.message} (a wishlist "${created.title}" foi criada — adicione manualmente)`,
        );
        return;
      }
      router.refresh();
      onClose();
    });
  };

  const tabClass = (isActive: boolean) =>
    isActive
      ? "rounded-full border px-4 py-1.5 text-sm font-body bg-ink-deep text-ivory-light border-ink-deep transition-colors"
      : "rounded-full border px-4 py-1.5 text-sm font-body bg-ivory-light border-border text-ink-soft hover:bg-paper-soft hover:text-ink-deep transition-colors";

  const showSectionInput =
    (tab === "book" && selectedBookIds.length > 0) ||
    (tab === "wishlist" && selectedWishlistIds.length > 0) ||
    tab === "new_wishlist";

  return (
    <Modal open={open} onClose={onClose} title="Adicionar à coleção" size="lg">
      <div className="space-y-5">
        {/* Tabs — só renderizadas em coleção wishlist. */}
        {isWishlistCollection && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => switchTab("wishlist")}
              className={tabClass(tab === "wishlist")}
            >
              Item de wishlist
            </button>
            <button
              type="button"
              onClick={() => switchTab("new_wishlist")}
              className={tabClass(tab === "new_wishlist")}
            >
              Criar nova wishlist
            </button>
          </div>
        )}

        {/* Tab: Livro existente (multi) */}
        {tab === "book" && (
          <SearchPicker
            label="Buscar livro"
            placeholder="Digite parte do título"
            query={query}
            onQueryChange={setQuery}
            results={bookResults}
            searching={searching}
            selectedIds={selectedBookIds}
            onToggle={toggleBookSelection}
            onClearSelection={clearSelection}
            kind="book"
          />
        )}

        {/* Tab: Wishlist existente (multi) */}
        {tab === "wishlist" && (
          <SearchPicker
            label="Buscar item da wishlist"
            placeholder="Digite parte do título"
            query={query}
            onQueryChange={setQuery}
            results={wishlistResults}
            searching={searching}
            selectedIds={selectedWishlistIds}
            onToggle={toggleWishlistSelection}
            onClearSelection={clearSelection}
            kind="wishlist"
          />
        )}

        {/* Tab: Criar nova wishlist (single) */}
        {tab === "new_wishlist" && (
          <div className="space-y-4">
            <Input
              label="Título"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              errorText={fieldErrors.title}
              autoFocus
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Autor"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
              />
              <Input
                label="Link de compra"
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Preço estimado"
                type="number"
                step="0.01"
                min={0}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                errorText={fieldErrors.estimated_price}
                leftIcon={<span className="text-sm">R$</span>}
              />
              <fieldset>
                <legend className="block text-sm font-body font-medium text-ink-deep mb-1.5">
                  Prioridade
                </legend>
                <div className="flex gap-2 flex-wrap">
                  {(
                    [
                      { v: "low", label: "Baixa" },
                      { v: "medium", label: "Média" },
                      { v: "high", label: "Alta" },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.v}
                      className={
                        newPriority === opt.v
                          ? "cursor-pointer rounded-full border px-3 py-1 text-xs font-body bg-ink-deep text-ivory-light border-ink-deep transition-colors"
                          : "cursor-pointer rounded-full border px-3 py-1 text-xs font-body bg-ivory-light border-border text-ink-soft hover:bg-paper-soft transition-colors"
                      }
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={opt.v}
                        checked={newPriority === opt.v}
                        onChange={() => setNewPriority(opt.v)}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <Textarea
              label="Observação"
              rows={2}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
            />
          </div>
        )}

        {/* Section input — comum a todos quando há seleção */}
        {showSectionInput && (
          <SectionAutocomplete
            value={section}
            onChange={setSection}
            options={sections}
          />
        )}

        {batchError && (
          <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
            {batchError}
          </p>
        )}

        {genericError && (
          <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
            {genericError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          {(tab === "book" || tab === "wishlist") && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={submitBatch}
              disabled={currentSelection.length === 0}
              loading={isPending}
            >
              {isPending
                ? "Adicionando..."
                : `Adicionar ${currentSelection.length} ${currentSelection.length === 1 ? "item" : "itens"}`}
            </Button>
          )}
          {tab === "new_wishlist" && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={submitNewWishlist}
              loading={isPending}
            >
              Criar e adicionar
            </Button>
          )}
        </div>

        {/* Suprime warning de variáveis não usadas — caches existem só pra
            referência futura caso queiramos mostrar items selecionados que
            saíram da busca atual. */}
        {false && (
          <span className="hidden">
            {Object.keys(bookCache).length}
            {Object.keys(wishlistCache).length}
          </span>
        )}
      </div>
    </Modal>
  );
}

// =====================================================================
// SearchPicker — renderiza input de busca, header com contador, e lista
// =====================================================================
type SearchPickerProps =
  | {
      kind: "book";
      label: string;
      placeholder: string;
      query: string;
      onQueryChange: (v: string) => void;
      results: BookForCollectionOption[];
      searching: boolean;
      selectedIds: string[];
      onToggle: (id: string) => void;
      onClearSelection: () => void;
    }
  | {
      kind: "wishlist";
      label: string;
      placeholder: string;
      query: string;
      onQueryChange: (v: string) => void;
      results: WishlistForCollectionOption[];
      searching: boolean;
      selectedIds: string[];
      onToggle: (id: string) => void;
      onClearSelection: () => void;
    };

function SearchPicker(props: SearchPickerProps) {
  const {
    label,
    placeholder,
    query,
    onQueryChange,
    searching,
    selectedIds,
    onToggle,
    onClearSelection,
    kind,
  } = props;
  const count = selectedIds.length;
  const hasSelection = count > 0;
  const helperBase =
    kind === "book"
      ? "Mostramos apenas livros que ainda não estão nesta coleção."
      : "Mostramos apenas items que ainda não estão nesta coleção.";

  return (
    <>
      <Input
        label={label}
        placeholder={placeholder}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        autoFocus
      />
      <div className="flex items-baseline justify-between gap-3 -mt-2">
        <p className="text-xs text-ink-fade">
          {hasSelection && (
            <span className="font-medium text-ink-deep not-italic">
              {count} selecionado{count === 1 ? "" : "s"}
            </span>
          )}
          {hasSelection && <span className="mx-1.5">·</span>}
          <span className="italic">{helperBase}</span>
        </p>
        {hasSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            className="text-xs text-ink-soft underline hover:text-burgundy transition-colors flex-shrink-0"
          >
            Limpar seleção
          </button>
        )}
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
        {searching && props.results.length === 0 ? (
          <p className="text-sm italic text-ink-fade px-1">Buscando…</p>
        ) : props.results.length === 0 ? (
          <p className="text-sm italic text-ink-fade px-1">
            {query ? "Nenhum resultado." : "Comece a digitar pra buscar."}
          </p>
        ) : kind === "book" ? (
          props.results.map((b) => (
            <ResultRow
              key={b.id}
              selected={selectedIds.includes(b.id)}
              onClick={() => onToggle(b.id)}
              cover={b.cover}
              title={b.title}
              subtitle={b.authors.length > 0 ? b.authors.join(", ") : "Sem autor"}
              wishlistStyle={false}
            />
          ))
        ) : (
          props.results.map((w) => (
            <ResultRow
              key={w.id}
              selected={selectedIds.includes(w.id)}
              onClick={() => onToggle(w.id)}
              cover={null}
              title={w.title}
              subtitle={
                (w.author_name ?? "Sem autor") +
                (w.estimated_price !== null
                  ? ` · R$ ${Number(w.estimated_price).toFixed(0)}`
                  : "")
              }
              wishlistStyle={true}
            />
          ))
        )}
      </div>
    </>
  );
}

function ResultRow({
  selected,
  onClick,
  cover,
  title,
  subtitle,
  wishlistStyle,
}: {
  selected: boolean;
  onClick: () => void;
  cover: string | null;
  title: string;
  subtitle: string;
  wishlistStyle: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "relative w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors",
        selected
          ? "border-2 border-gold bg-paper/50"
          : "border-2 border-transparent hover:border-roasted-chestnut/40 hover:bg-paper/40",
      )}
    >
      <div
        className={clsx(
          "w-9 flex-shrink-0 relative rounded-sm overflow-hidden border",
          wishlistStyle
            ? "border-terracota/35 bg-terracota/[0.10]"
            : "border-ink-deep/20",
        )}
        style={{ aspectRatio: "2 / 3" }}
      >
        <BookCoverFallback title={title} size="sm" className="w-full h-full" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-base text-ink-deep leading-tight line-clamp-1">
          {title}
        </p>
        <p className="text-xs italic text-ink-fade leading-tight">{subtitle}</p>
      </div>
      {selected && (
        <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-moss text-ivory-light shadow-sm">
          <CheckIcon className="w-4 h-4" />
        </span>
      )}
    </button>
  );
}

function SectionAutocomplete({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [focused, setFocused] = useState(false);
  const trimmed = value.trim().toLowerCase();
  const suggestions = options
    .filter((o) => o.toLowerCase().includes(trimmed) && o !== value)
    .slice(0, 6);
  return (
    <div className="relative">
      <Input
        label="Seção (opcional)"
        placeholder="Ex: Comprados, Clube, A. Christie"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        helperText={
          options.length > 0
            ? "Digite uma seção existente ou crie uma nova. Aplicada a todos os items selecionados."
            : "Esta coleção ainda não tem seções; digite um nome pra criar a primeira"
        }
      />
      {focused && suggestions.length > 0 && (
        <ul className="absolute z-10 left-0 right-0 mt-1 rounded-md border border-border bg-ivory-light shadow-lg max-h-40 overflow-y-auto custom-scrollbar">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(s);
                }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-paper-soft transition-colors"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
