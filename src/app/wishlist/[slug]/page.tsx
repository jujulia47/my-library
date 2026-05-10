import AppShell from "@/components/AppShell";
import WishlistDetailClient, {
  type WishlistDetail,
} from "@/components/DetailsPage/WishlistDetailClient";
import { wishlistBySlug } from "@/services/wishlistList";
import { wishlistCollections } from "@/services/collectionDetail";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await wishlistBySlug(slug);

  if (!item) {
    return (
      <AppShell>
        <p className="text-ink-soft italic">Item não encontrado.</p>
      </AppShell>
    );
  }

  const collections = await wishlistCollections(item.id);

  const detail: WishlistDetail = {
    id: item.id,
    slug: item.slug,
    title: item.title,
    author_name: item.author_name,
    purchase_link: item.purchase_link,
    estimated_price:
      item.estimated_price !== null ? Number(item.estimated_price) : null,
    priority: item.priority,
    notes: item.notes,
    collections,
  };

  return (
    <AppShell>
      <WishlistDetailClient item={detail} />
    </AppShell>
  );
}
