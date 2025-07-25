import ReadWishlist from "@/components/Read/Wishlist/ReadWishlist"
import SideMenu from "@/components/SideMenu"
import { wishlistWithRelations } from "@/services/wishlist";


export default async function wishlistPage() {
  const wishlist = await wishlistWithRelations() ?? [];

  return (
    <div>
      <section className="fixed z-40">
        <SideMenu />
      </section>
      <section className="ml-64">
        < ReadWishlist wishlist={wishlist} />
      </section>
    </div>
  );
}
