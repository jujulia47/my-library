"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export type BackButtonProps = {
  /**
   * Destino quando não há `?from=` válido nem histórico de browser. Mantido
   * opcional pra retrocompat — chamadas antigas passam fallback explícito.
   */
  fallback?: string;
  label?: string;
  className?: string;
};

function isSafeRelative(path: string): boolean {
  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.toLowerCase().startsWith("/javascript:")
  );
}

/**
 * Botão "Voltar" sensível ao contexto (sessão 17.10 — prioridade ajustada).
 * Prioridade de destino:
 *   1. `router.back()` — caminho default. Funciona como o "voltar" do
 *      browser: usa o histórico real, sem criar entradas novas. Resolve
 *      o loop edit ⇄ detail que acontecia quando `?from=` era usado via
 *      `router.push` (que adicionava um novo entry e o próximo back caía
 *      de volta no edit).
 *   2. `?from=` na URL — fallback quando o histórico tá vazio (chegou na
 *      página via redirect server-side, link aberto em aba nova etc.).
 *   3. `fallback` prop — fallback explícito da feature.
 *   4. `/` — último recurso.
 */
export default function BackButton({
  fallback,
  label = "Voltar",
  className,
}: BackButtonProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    const from = sp.get("from");
    if (from && isSafeRelative(from)) {
      router.replace(from);
      return;
    }
    if (fallback && isSafeRelative(fallback)) {
      router.replace(fallback);
      return;
    }
    router.replace("/");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        "inline-flex items-center gap-2 px-2 py-1 -ml-2 rounded-md font-body italic",
        "text-ink-soft hover:text-ink-deep hover:bg-paper-soft",
        "transition-colors duration-150",
        className,
      )}
    >
      <ArrowLeftIcon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
