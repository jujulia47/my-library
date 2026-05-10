import AppShell from "@/components/AppShell";
import WishlistForm from "@/components/forms/WishlistForm";
import { wishlistById } from "@/services/wishlistList";

export default async function EditWishlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await wishlistById(id);

  if (!item) {
    return (
      <AppShell>
        <p className="text-ink-soft italic">Item não encontrado.</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <WishlistForm
        mode="edit"
        initial={{
          id: item.id,
          title: item.title,
          author_name: item.author_name,
          purchase_link: item.purchase_link,
          estimated_price:
            item.estimated_price !== null
              ? Number(item.estimated_price)
              : null,
          priority: item.priority,
          notes: item.notes,
        }}
      />
    </AppShell>
  );
}
