import CreateCollection from "@/components/Create/Collection";
import { serieList } from "@/services/serie";
import { bookList } from "@/services/book";
import { wishlistList } from "@/services/wishlist";

const series = await serieList();
const books = await bookList();
const wishlists = await wishlistList();

export default async function CreateCollectionPage() {
  return (
    <>
      <main>
        < CreateCollection series={series} books={books} wishlists={wishlists}/>
      </main>
    </>
  );
}
