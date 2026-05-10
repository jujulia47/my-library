"use client";

import Link from "next/link";
import { useDroppable } from "@dnd-kit/core";
import { PlusIcon } from "@heroicons/react/24/outline";

type Props = {
  shelfId: string;
  /** Posição no fim da prateleira pra cálculo do droppable. */
  position: number;
};

/**
 * Slot "+" no fim de cada prateleira (sessão 17.4 — bug fix: agora aparece
 * em todas as prateleiras, não só na última). Click navega pra picker;
 * também é zona de drop pro DnD.
 */
export function AddBookSlot({ shelfId, position }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `empty-${shelfId}-${position}`,
    data: { type: "book-position", shelfId, position },
  });
  return (
    <Link
      ref={setNodeRef as unknown as React.Ref<HTMLAnchorElement>}
      href={`/library/shelf/${shelfId}/add`}
      aria-label="Adicionar livro à estante"
      className={`add-book-slot ${
        isOver ? "border-gold bg-gold/15 scale-105" : ""
      }`}
    >
      <PlusIcon className="w-4 h-4 text-gold" />
    </Link>
  );
}
