"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button, EmptyState } from "@/components/ui";

export function NoBooks() {
  return (
    <EmptyState
      title="Sua biblioteca está vazia"
      description="Comece catalogando seu primeiro livro."
      action={
        <Button as="Link" href="/book/new" variant="primary">
          Catalogar livro
        </Button>
      }
    />
  );
}

export function NoFilteredBooks() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <EmptyState
      title="Nenhum livro nesse filtro"
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
