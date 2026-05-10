"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button, EmptyState } from "@/components/ui";

export function NoQuotes() {
  return (
    <EmptyState
      title="Nenhuma citação ainda"
      description="Salve trechos que ficaram com você — de livros ou de qualquer lugar."
      action={
        <Button as="Link" href="/quote/new" variant="primary">
          + Adicionar citação
        </Button>
      }
    />
  );
}

export function NoFilteredQuotes() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <EmptyState
      title="Nenhuma citação nesse filtro"
      description="Tente outro recorte ou limpe os filtros."
      action={
        <Button
          variant="ghost"
          onClick={() => router.push(pathname)}
          type="button"
        >
          Limpar filtros
        </Button>
      }
    />
  );
}
