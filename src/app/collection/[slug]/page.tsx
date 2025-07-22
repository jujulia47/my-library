import DetailsCollectionPage from "@/components/DetailsPage/collection";
import {getCollectionWithRelationsSlug} from "@/services/collections";
import { imagesUrl } from "@/services/images";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const collection = await getCollectionWithRelationsSlug(slug);

  if (!collection || collection.length === 0 || !collection[0]) {
    return (
      <DetailsCollectionPage
        collection={[]}
        booksInfos={[]}
        seriesInfos={[]}
        wishlistInfos={[]}
      />
    );
  }

  const books = collection?.[0]?.collection_book.map((book) => book.book) ?? [];
  const series = collection?.[0]?.collection_serie.map((serie) => serie.serie) ?? [];
  const wishlist = collection?.[0]?.collection_wishlist.map((wishlist) => wishlist.wishlist) ?? [];
  
  const booksInfos = books.map((book) => ({
    id: book?.id ?? 0,
    title: book?.title ?? "",
    volume: book?.volume ?? null,
    rating: book?.rating ?? null,
    status: book?.status ?? "",
    author: book?.author ?? "",
    cover: imagesUrl(book?.cover ?? "")
  }));

  const seriesInfos = series.map((serie) => ({
    id: serie?.id ?? 0,
    serie_name: serie?.serie_name ?? "",
    qty_volumes: serie?.qty_volumes ?? null,
    status: serie?.status ?? "",
    rating: serie?.rating ?? null,
  })); 

  const wishlistInfos = wishlist.map((wishlist) => ({
    id: wishlist?.id ?? 0,
    book_name: wishlist?.book_name ?? "",
    author: wishlist?.author ?? "",
  }));

  if (!collection) {
    return <div>Sem coleções disponíveis.</div>;
  }

  return (
    <>
      <main>
        <DetailsCollectionPage
          collection={collection}
          booksInfos={booksInfos}
          seriesInfos={seriesInfos}
          wishlistInfos={wishlistInfos}
        />
      </main>
    </>
  );
}
