"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button, EmptyState } from "@/components/ui";

export function NoSeries() {
  return (
    <EmptyState
      title="Você ainda não tem séries"
      description="Crie uma série pra acompanhar volume por volume."
      action={
        <Button as="Link" href="/serie/new" variant="primary">
          Adicionar série
        </Button>
      }
    />
  );
}

export function NoFilteredSeries() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <EmptyState
      title="Nenhuma série nesse filtro"
      description="Tente outro recorte ou volte para a lista completa."
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
