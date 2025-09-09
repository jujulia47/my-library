import ReadWishlist from "@/components/Read/Wishlist/ReadWishlist"
import SideMenu from "@/components/SideMenu"
// import { wishlistWithRelations } from "@/services/wishlist";
import { wishlistList } from "@/services/wishlist";


export default async function wishlistPage() {
  // const wishlist = await wishlistWithRelations() ?? [];
  // console.log(wishlist, "wishlist");
  const wishlist = await wishlistList() ?? [];
  console.log(wishlist, "wishlistAll");


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
