"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@heroicons/react/24/outline";
import { createShelf } from "@/actions/createShelf";

/**
 * Slot integrado pra criar nova estante (sessão 17.5). Aparece **depois** da
 * última prateleira existente como uma "estante fantasma" tracejada de
 * altura plena. Mais sutil que FAB; coerente com a metáfora de biblioteca
 * real ("vazio que pode ser preenchido"). Click → `createShelf` action.
 */
export function AddShelfSlot() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await createShelf();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="px-4 mt-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label="Criar nova estante"
        className="add-shelf-slot disabled:opacity-50"
      >
        <PlusIcon className="w-7 h-7 text-gold/70" />
        <span className="font-display italic text-sm text-gold-deep/80 mt-2">
          Nova estante
        </span>
      </button>
      {error && (
        <p className="mt-2 text-[11px] italic text-burgundy text-center">
          {error}
        </p>
      )}
    </div>
  );
}
