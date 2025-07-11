import UpdateBook from "@/components/Update/Book";
import { bookById } from "@/services/book";
import { serieList } from "@/services/serie"

export default async function Page({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;
  const book = await bookById(id);
  const series = await serieList();

  if (!book) {
    return <div>Sem livros disponíveis.</div>;
  }

  return (
    <>
      <main>
        <UpdateBook id={id} book={book} series={series}/>
      </main>
    </>
  );
}
