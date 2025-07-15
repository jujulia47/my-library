import { bookSlug } from "@/services/book";
import DetailsBookPage from "@/components/DetailsPage/Book";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const book = await bookSlug(slug);

  if (!book) {
    return <div>Livro não encontrado.</div>;
  }

  return (
    <main>
      <DetailsBookPage book={book}/>
    </main>
  );
}
