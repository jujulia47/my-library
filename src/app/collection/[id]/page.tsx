import UpdateCollection from "@/components/Update/Collection";
import { bookList } from "@/services/book";
import { serieList } from "@/services/serie";
import { wishlistList } from "@/services/wishlist";
import {
  collectionById, getCollectionWithRelations
} from "@/services/collections";

export default async function Page({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;
  const collection = await collectionById(id);
  const collectionRelations = await getCollectionWithRelations(id);
  const series = await serieList();
  const books = await bookList();
  const wishlist = await wishlistList();

  if (!collection) {
    return <div>Sem coleções disponíveis.</div>;
  }

  return (
    <>
      <main>
        <UpdateCollection
          id={id}
          collection={collection}
          collectionRelations={collectionRelations}
          series={series}
          books={books}
          wishlist={wishlist}
        />
      </main>
    </>
  );
}
