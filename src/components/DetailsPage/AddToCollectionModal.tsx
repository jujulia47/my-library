"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/forms/Modal";
import { CollectionTypeBadge } from "@/components/ui";
import { addCollectionItem } from "@/actions/addCollectionItem";
import type { AvailableCollection } from "./BookDetailClient";

type Props = {
  bookId: string;
  collections: AvailableCollection[];
  onClose: () => void;
};

/**
 * Modal pra adicionar o livro a uma coleção direto da página do livro. Lista as
 * coleções que aceitam livros e onde ele ainda NÃO está. Ao escolher, chama
 * addCollectionItem (com seção opcional).
 */
export default function AddToCollectionModal({
  bookId,
  collections,
  onClose,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [section, setSection] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (collectionId: string) => {
    setSaving(true);
    setError(null);
    const result = await addCollectionItem({
      collection_id: collectionId,
      book_id: bookId,
      section: section.trim() || null,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Adicionar a uma coleção" size="sm">
      <div className="space-y-3">
        {collections.length === 0 ? (
          <p className="text-sm italic text-ink-fade py-2">
            O livro já está em todas as suas coleções.
          </p>
        ) : (
          <>
            <ul className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {collections.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(c.id)}
                    className={`w-full flex items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors ${
                      selected === c.id
                        ? "border-[#6D3914] bg-[#6D3914]/[0.06]"
                        : "border-border bg-ivory-light hover:bg-paper-soft"
                    }`}
                  >
                    <CollectionTypeBadge type={c.type} size="sm" />
                    <span className="text-sm text-ink-deep flex-1 min-w-0 truncate">
                      {c.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div>
              <label className="block text-xs text-ink-fade mb-1">
                Seção (opcional)
              </label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="Ex.: Caixinha 12, Poirot…"
                className="w-full rounded-md border border-border bg-ivory-light px-3 py-2 text-sm text-ink-deep focus:border-[#6D3914] focus:ring-2 focus:ring-[#6D3914]/20 outline-none"
              />
            </div>

            {error && (
              <p className="text-sm text-burgundy bg-burgundy/10 border border-burgundy/30 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-3 py-1.5 rounded-md text-sm text-ink-soft hover:text-ink-deep transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selected || saving}
                onClick={() => selected && handleAdd(selected)}
                className="px-4 py-1.5 rounded-md text-sm bg-[#6D3914] text-ivory hover:bg-[#4C2B08] disabled:opacity-50 transition-colors"
              >
                {saving ? "Adicionando…" : "Adicionar"}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
