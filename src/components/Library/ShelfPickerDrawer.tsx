"use client";

import { motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { PlusIcon } from "@heroicons/react/24/outline";
import { ShelfSymbol } from "./ShelfSymbol";
import type { Shelf, ShelfBook } from "@/services/libraryData";

type Props = {
  allShelves: Shelf[];
  currentShelfId: string;
  draggedBook: ShelfBook | null;
};

/**
 * Drawer lateral que aparece durante drag. Permite soltar o livro em qualquer
 * estante (incluindo a atual — vai pro fim) ou criar uma nova. Animação leve
 * de slide via Framer Motion.
 */
export function ShelfPickerDrawer({
  allShelves,
  currentShelfId,
  draggedBook,
}: Props) {
  if (!draggedBook) return null;

  return (
    <motion.div
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 80, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed right-4 top-1/2 -translate-y-1/2 rounded-lg p-3 shadow-2xl z-50 max-h-[80vh] overflow-y-auto custom-scrollbar"
      style={{
        background: "rgba(26,15,8,0.95)",
        border: "1px solid rgba(240,192,64,0.3)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        minWidth: 220,
      }}
    >
      <p
        className="text-xs italic mb-3"
        style={{ color: "rgba(245, 232, 208, 0.65)" }}
      >
        Mover &quot;{draggedBook.title}&quot; para...
      </p>
      <div className="flex flex-col gap-2">
        {allShelves.map((shelf) => (
          <DroppableShelfMini
            key={shelf.id}
            shelf={shelf}
            isCurrent={shelf.id === currentShelfId}
          />
        ))}
        <DroppableNewShelf />
      </div>
    </motion.div>
  );
}

function DroppableShelfMini({
  shelf,
  isCurrent,
}: {
  shelf: Shelf;
  isCurrent: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `shelf-target-${shelf.id}`,
    data: { type: "shelf-target", shelfId: shelf.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-3 px-3 py-2 rounded border transition-all ${
        isOver
          ? "border-gold bg-gold/15 scale-105"
          : isCurrent
            ? "border-gold/20 opacity-50"
            : "hover:border-gold/60"
      }`}
      style={{
        borderColor: isOver
          ? undefined
          : isCurrent
            ? undefined
            : "var(--color-shelf-border)",
        color: "rgba(245, 232, 208, 0.85)",
      }}
    >
      <ShelfSymbol symbol={shelf.symbol} size={18} />
      <span className="text-xs flex-1">
        {shelf.total_books} {shelf.total_books === 1 ? "livro" : "livros"}
      </span>
      {isCurrent && (
        <span
          className="text-[10px] italic"
          style={{ color: "rgba(245, 232, 208, 0.45)" }}
        >
          atual
        </span>
      )}
    </div>
  );
}

function DroppableNewShelf() {
  const { setNodeRef, isOver } = useDroppable({
    id: "new-shelf",
    data: { type: "new-shelf" },
  });
  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-3 px-3 py-2 rounded border-2 border-dashed transition-all ${
        isOver
          ? "border-gold bg-gold/10 scale-105"
          : "border-gold/30 hover:border-gold/60"
      }`}
      style={{ color: "rgba(240,192,64,0.8)" }}
    >
      <PlusIcon className="w-4 h-4" />
      <span className="text-xs italic">Nova estante</span>
    </div>
  );
}
