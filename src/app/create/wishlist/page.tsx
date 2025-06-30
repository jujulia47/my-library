import CreateWishlist from "@/components/Create/Wishlist";
import { serieList } from "@/services/serie"

export default async function CreateWishlistPage() {
  const series = await serieList();

  return (
    <>
      <main>
        < CreateWishlist series={series}/>
      </main>
    </>
  );
}
