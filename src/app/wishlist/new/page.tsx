import AppShell from "@/components/AppShell";
import WishlistForm from "@/components/forms/WishlistForm";

export default function CreateWishlistPage() {
  return (
    <AppShell>
      <WishlistForm mode="create" />
    </AppShell>
  );
}
