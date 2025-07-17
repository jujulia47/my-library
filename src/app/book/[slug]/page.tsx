import { bookSlug } from "@/services/book";
import DetailsBookPage from "@/components/DetailsPage/Book";
import { imagesUrl } from "@/services/images";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const book = await bookSlug(slug);
  const imageUrl = await imagesUrl(book?.[0]?.cover ?? "");

  if (!book) {
    return <div>Livro não encontrado.</div>;
  }

  return (
    <main>
      <DetailsBookPage book={book} imageUrl={imageUrl}/>
    </main>
  );
}
