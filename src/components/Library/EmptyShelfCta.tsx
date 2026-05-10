"use client";

import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";

type Props = {
  shelfId: string;
  large?: boolean;
};

/**
 * Estado vazio — "+" grande centralizado na prateleira (sessão 17.4 bug fix).
 * `large` = vista zoom (96px); default = vista parede (56px).
 */
export function EmptyShelfCta({ shelfId, large = false }: Props) {
  const sizeClass = large
    ? "w-24 h-24 text-2xl"
    : "w-14 h-14 text-base";
  const iconSize = large ? "w-7 h-7" : "w-5 h-5";

  return (
    <div className="flex flex-col items-center justify-center gap-2 m-auto">
      <Link
        href={`/library/shelf/${shelfId}/add`}
        aria-label="Adicionar primeiro livro"
        className={`empty-shelf-cta ${sizeClass}`}
      >
        <PlusIcon className={`${iconSize} text-gold`} />
      </Link>
      <span
        className={`font-display italic text-gold-deep ${
          large ? "text-sm" : "text-xs"
        }`}
      >
        Adicionar primeiro livro
      </span>
    </div>
  );
}
