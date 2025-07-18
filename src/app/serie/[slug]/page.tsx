import { serieSlug } from "@/services/serie";
import DetailsSeriePage from "@/components/DetailsPage/Serie";
import { imagesUrl } from "@/services/images";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const serie = await serieSlug(slug);

  if (!serie || serie.length === 0 || !serie[0]) {
    return (
      <DetailsSeriePage
        serie={[]}
        booksInfos={[]}
      />
    );
  }

  const books = serie[0].book ?? [];

  const booksInfos = books.map((book) => ({
    id: book.id,
    title: book.title,
    volume: book.volume,
    rating: book.rating,
    status: book.status,
    author: book.author,
    cover: imagesUrl(book.cover ?? "")
  }));

  return (
    <main>
      <DetailsSeriePage serie={serie} booksInfos={booksInfos} />
    </main>
  );
}
