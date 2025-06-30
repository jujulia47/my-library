import UpdateWishlist from "@/components/Update/Wishlist";
import { serieList } from "@/services/serie";
import { wishlistById } from "@/services/wishlist"

export default async function Page({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;
  const wishlist = await wishlistById(id);
  const series = await serieList();

  if (!wishlist) {
    return <div>Sem Série disponíveis.</div>;
  }

  return (
    <>
      <main>
        <UpdateWishlist id={id} wishlist={wishlist} series={series}/>
      </main>
    </>
  );
}
