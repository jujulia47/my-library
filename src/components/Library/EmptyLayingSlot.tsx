"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ShelfSlot } from "@/utils/shelfLayout";

type Props = {
  shelfId: string;
  slot: ShelfSlot;
  isDragging: boolean;
  /** Sessão 17.8: gravidade do cluster — apenas a próxima posição vazia
   *  bottom-up é destaque ativo (verde gold preenchido). Outras ficam
   *  só tracejado discreto. */
  isValidDrop: boolean;
};

/**
 * Slot horizontal fino vazio dentro de um cluster `laying-stack`. Invisível
 * em repouso; tracejado dourado durante drag global. Apenas o próximo slot
 * disponível pela gravidade é drop target ativo de fato.
 */
export function EmptyLayingSlot({
  shelfId,
  slot,
  isDragging,
  isValidDrop,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${shelfId}-${slot.position}`,
    data: { type: "book-position", shelfId, position: slot.position },
    disabled: !isValidDrop,
  });

  const className = [
    "empty-laying-slot",
    isDragging ? "drop-target" : "",
    isValidDrop ? "is-valid-drop" : "",
    isOver ? "is-over" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={isValidDrop ? setNodeRef : undefined}
      className={className}
      aria-hidden={!isDragging}
    />
  );
}
