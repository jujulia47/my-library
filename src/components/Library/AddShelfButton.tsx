"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@heroicons/react/24/outline";
import { createShelf } from "@/actions/createShelf";

const ARCH_HEIGHT = 72;
const BODY_HEIGHT = 460;
const WIDTH = 100;

export function AddShelfButton() {
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
    <div className="flex-shrink-0" style={{ width: WIDTH }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label="Criar nova estante"
        className="block w-full border-2 border-dashed border-gold/30 hover:border-gold rounded-md flex flex-col items-center justify-center gap-2 text-gold/60 hover:text-gold bg-black/20 transition-colors disabled:opacity-50"
        style={{ marginTop: ARCH_HEIGHT, height: BODY_HEIGHT }}
      >
        <PlusIcon className="w-8 h-8" />
        <span className="text-xs leading-tight text-center px-2">
          Nova<br />estante
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
