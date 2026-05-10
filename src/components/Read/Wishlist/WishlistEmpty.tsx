"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button, EmptyState } from "@/components/ui";

export function NoWishlist() {
  return (
    <EmptyState
      title="Sua lista de desejos está vazia"
      description="Anote livros que você quer ter ou ler — eles ficam aqui até você decidir comprar."
      action={
        <Button as="Link" href="/wishlist/new" variant="primary">
          + Adicionar à wishlist
        </Button>
      }
    />
  );
}

export function NoFilteredWishlist() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <EmptyState
      title="Nada nesse filtro"
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
