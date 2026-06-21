"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@heroicons/react/24/outline";
import { deleteShelf } from "@/actions/deleteShelf";

type Props = {
  shelfId: string;
};

/**
 * Botão sutil pra excluir uma estante VAZIA. Só aparece quando o shelf não tem
 * livros (parent decide). Pede confirmação inline antes de chamar a action.
 */
export function DeleteShelfButton({ shelfId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteShelf(shelfId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.message ?? "Erro ao excluir estante.");
        setConfirming(false);
      }
    });
  };

  if (confirming) {
    return (
      <div className="flex flex-col items-center gap-1.5 m-auto">
        <p className="font-display italic text-xs text-gold-deep">
          Excluir esta estante?
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs px-2.5 py-1 rounded-sm border border-red-700/50 text-red-300 hover:bg-red-900/30 transition-colors disabled:opacity-50"
          >
            {isPending ? "Excluindo..." : "Excluir"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={isPending}
            className="text-xs px-2.5 py-1 rounded-sm border border-gold/30 text-gold-deep hover:border-roasted-chestnut transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
        {error && (
          <p className="text-[10px] text-red-300 italic">{error}</p>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label="Excluir estante vazia"
      title="Excluir estante vazia"
      className="text-gold-deep/60 hover:text-red-400 transition-colors p-1.5 rounded-sm"
    >
      <TrashIcon className="w-4 h-4" />
    </button>
  );
}
