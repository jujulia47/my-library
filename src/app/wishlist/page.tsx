import ReadWishlist from "@/components/Read/Wishlist/ReadWishlist"
import SideMenu from "@/components/SideMenu"


export default async function wishlistPage() {


  return (
    <div>
      <section className="fixed z-40">
        <SideMenu />
      </section>
      <section className="ml-64">
        < ReadWishlist />
      </section>
    </div>
  );
}
