"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button, EmptyState } from "@/components/ui";

export function NoAuthors() {
  return (
    <EmptyState
      title="Nenhum autor cadastrado"
      description="Autores aparecem aqui automaticamente quando você cadastra livros, ou você pode adicionar diretamente com foto, biografia e datas."
      action={
        <Button as="Link" href="/author/new" variant="primary">
          + Novo autor
        </Button>
      }
    />
  );
}

export function NoFilteredAuthors() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <EmptyState
      title="Nenhum autor com esses filtros"
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
