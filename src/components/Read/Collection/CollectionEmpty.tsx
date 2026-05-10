"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button, EmptyState } from "@/components/ui";

export function NoCollections() {
  return (
    <EmptyState
      title="Nenhuma coleção ainda"
      description="Coleções organizam seu acervo: agrupe livros por tema (Estante), monte listas temporárias (Lista), defina metas (Desafio), registre livros de assinatura (Assinatura), ou organize livros que quer comprar (Wishlist)."
      action={
        <Button as="Link" href="/collection/new" variant="primary">
          + Nova coleção
        </Button>
      }
    />
  );
}

export function NoFilteredCollections() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <EmptyState
      title="Nenhuma coleção nesse filtro"
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
