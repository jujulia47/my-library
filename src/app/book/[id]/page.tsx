import UpdateBook from "@/components/Update/Book";
import { bookList } from "@/services/book";
import { serieList } from "@/services/serie"

export default async function Page({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;
  const book = await bookList(id);
  const series = await serieList();


  console.log("slug", id);

  if (!book) {
    return <div>Sem livros disponíveis.</div>;
  }

  return (
    <>
      <div>My Post: {id}</div>
      <div>
        <UpdateBook id={id} book={book} series={series}/>
      </div>
    </>
  );
}
