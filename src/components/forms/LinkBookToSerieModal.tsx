"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { Input, Button, BookCoverFallback } from "@/components/ui";
import { imagesUrl } from "@/services/images";
import { linkBookToSerie } from "@/actions/linkBookToSerie";
import type { UnlinkedBookOption } from "@/app/api/books/unlinked/route";

export type LinkBookToSerieModalProps = {
  open: boolean;
  onClose: () => void;
  serieId: string;
  serieSlug?: string;
  /** Volumes já ocupados na série — usado pra sugerir o próximo. */
  occupiedVolumes: number[];
  /**
   * Override do comportamento padrão pós-vínculo (router.refresh + onClose).
   * Útil quando o modal é aberto fora da detail page da série e queremos
   * navegar pra outro lugar (ex: do banner em /book/new, redirect pra
   * /serie/[slug] após sucesso).
   */
  onSuccess?: () => void;
};

function suggestNextVolume(occupied: number[]): number {
  if (occupied.length === 0) return 1;
  const sorted = [...occupied].sort((a, b) => a - b);
  let candidate = 1;
  for (const v of sorted) {
    if (v > candidate) return candidate; // gap found
    candidate = v + 1;
  }
  return candidate;
}

export default function LinkBookToSerieModal({
  open,
  onClose,
  serieId,
  serieSlug,
  occupiedVolumes,
  onSuccess,
}: LinkBookToSerieModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnlinkedBookOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<UnlinkedBookOption | null>(null);
  const [volume, setVolume] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [genericError, setGenericError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<number | null>(null);

  // Reset state ao abrir/fechar
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setSelected(null);
    setVolume(String(suggestNextVolume(occupiedVolumes)));
    setFieldErrors({});
    setGenericError(null);
  }, [open, occupiedVolumes]);

  // Busca debounced
  useEffect(() => {
    if (!open || selected) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true);
      try {
        const url = `/api/books/unlinked?q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (!res.ok) {
          setResults([]);
          return;
        }
        const json = (await res.json()) as { books: UnlinkedBookOption[] };
        setResults(json.books);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, open, selected]);

  const submit = () => {
    if (!selected) return;
    setFieldErrors({});
    setGenericError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("book_id", selected.id);
      fd.set("serie_id", serieId);
      fd.set("volume", volume);
      if (serieSlug) fd.set("serie_slug", serieSlug);
      const result = await linkBookToSerie(fd);
      if (!result.ok) {
        if (result.field) {
          setFieldErrors({ [result.field]: result.message });
        } else {
          setGenericError(result.message);
        }
        return;
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
        onClose();
      }
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Vincular livro a esta série"
      size="md"
    >
      <div className="space-y-5">
        {!selected ? (
          <>
            <Input
              label="Buscar livro"
              placeholder="Digite parte do título"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              helperText="Mostramos apenas livros que ainda não estão em nenhuma série."
            />
            <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
              {searching && results.length === 0 ? (
                <p className="text-sm italic text-ink-fade px-1">Buscando…</p>
              ) : results.length === 0 ? (
                <p className="text-sm italic text-ink-fade px-1">
                  {query
                    ? "Nenhum livro encontrado."
                    : "Comece a digitar pra buscar."}
                </p>
              ) : (
                results.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelected(b)}
                    className="w-full flex items-center gap-3 p-2 rounded-md border border-transparent hover:border-gold hover:bg-paper/40 text-left transition-colors"
                  >
                    <div
                      className="w-9 flex-shrink-0 relative rounded-sm overflow-hidden border border-ink-deep/20"
                      style={{ aspectRatio: "2 / 3" }}
                    >
                      <BookCoverFallback
                        title={b.title}
                        size="sm"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-base text-ink-deep leading-tight line-clamp-1">
                        {b.title}
                      </p>
                      <p className="text-xs italic text-ink-fade leading-tight">
                        {b.authors.length > 0
                          ? b.authors.join(", ")
                          : "Sem autor"}
                        {b.publication_year && ` · ${b.publication_year}`}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-paper/40">
              <div
                className="w-12 flex-shrink-0 relative rounded-sm overflow-hidden border border-ink-deep/20"
                style={{ aspectRatio: "2 / 3" }}
              >
                <BookCoverFallback
                  title={selected.title}
                  size="sm"
                  className="w-full h-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-base text-ink-deep leading-tight line-clamp-1">
                  {selected.title}
                </p>
                <p className="text-xs italic text-ink-fade leading-tight">
                  {selected.authors.length > 0
                    ? selected.authors.join(", ")
                    : "Sem autor"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xs italic text-ink-fade hover:text-burgundy underline transition-colors"
              >
                trocar
              </button>
            </div>

            <Input
              label="Volume"
              name="volume"
              type="number"
              min={1}
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              errorText={fieldErrors.volume}
            />
          </>
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
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={submit}
            disabled={!selected}
            loading={isPending}
          >
            Vincular livro
          </Button>
        </div>
      </div>
    </Modal>
  );
}
