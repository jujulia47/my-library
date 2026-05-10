"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ShelfSlot } from "@/utils/shelfLayout";

type Props = {
  shelfId: string;
  slot: ShelfSlot;
  isDragging: boolean;
};

/**
 * Slot vazio invisível em repouso; tracejado dourado durante drag global.
 *
 * Tipos suportados (sessão 17.8):
 *  - standing → vertical alto tracejado
 *  - tilted   → vertical inclinado na direção do lean
 *  - decoration → não-droppable (não chega aqui na prática)
 *
 * O tipo `laying-stack` é renderizado por `<LayingStackCluster>` que usa
 * `<EmptyLayingSlot>` internamente — esse componente trata só dos slots
 * únicos verticais.
 */
export function EmptySlot({ shelfId, slot, isDragging }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${shelfId}-${slot.position}`,
    data: { type: "book-position", shelfId, position: slot.position },
    disabled: slot.type === "decoration",
  });

  if (slot.type === "decoration" || slot.type === "laying-stack") {
    return null;
  }

  const showVisible = isDragging;
  const baseClass = "empty-slot flex-shrink-0 transition-all duration-200";
  const typeClass =
    slot.type === "standing"
      ? "empty-slot-standing"
      : `empty-slot-tilted lean-${slot.leanDirection ?? "left"}`;

  return (
    <div
      ref={setNodeRef}
      className={`${baseClass} ${typeClass} ${
        showVisible ? "drop-target" : ""
      } ${isOver ? "is-over" : ""}`}
      aria-hidden={!showVisible}
    />
  );
}
