import UpdateBook from "@/components/Update/Book";
import { bookById } from "@/services/book";
import { serieList } from "@/services/serie"
import { imagesUrl } from "@/services/images";
import { rereadingByBookId } from "@/services/rereading";
import {wishlistByBookId} from "@/services/wishlist"

export default async function Page({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;
  const book = await bookById(id);
  const series = await serieList();
  const imageUrl = imagesUrl(book?.[0]?.cover ?? "");
  const rereads  = await rereadingByBookId(id);
  const wishlist = await wishlistByBookId(id);
  if (!book) {
    return <div>Sem livros disponíveis.</div>;
  }

  return (
    <>
      <main>
        <UpdateBook id={id} book={book} series={series} imageUrl={imageUrl} rereads={rereads} wishlist={wishlist}/>
      </main>
    </>
  );
}
