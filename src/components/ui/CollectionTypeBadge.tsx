import Badge, { type BadgeSize, type BadgeVariant } from "./Badge";
import type { Database } from "@/utils/typings/supabase";

type CollectionType = Database["public"]["Enums"]["collection_type"];

const CONFIG: Record<
  CollectionType,
  { label: string; variant: BadgeVariant }
> = {
  shelf: { label: "Estante", variant: "olive" },
  list: { label: "Lista", variant: "moss" },
  challenge: { label: "Desafio", variant: "gold" },
  subscription: { label: "Assinatura", variant: "terracota" },
  wishlist: { label: "Wishlist", variant: "navy" },
};

export type CollectionTypeBadgeProps = {
  type: CollectionType;
  size?: BadgeSize;
};

export default function CollectionTypeBadge({
  type,
  size = "sm",
}: CollectionTypeBadgeProps) {
  const cfg = CONFIG[type];
  return (
    <Badge variant={cfg.variant} size={size}>
      {cfg.label}
    </Badge>
  );
}

export const collectionTypeLabels: Record<CollectionType, string> = {
  shelf: CONFIG.shelf.label,
  list: CONFIG.list.label,
  challenge: CONFIG.challenge.label,
  subscription: CONFIG.subscription.label,
  wishlist: CONFIG.wishlist.label,
};
