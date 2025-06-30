import UpdateSerie from "@/components/Update/Serie";
import { bookList } from "@/services/book";
import { serieById } from "@/services/serie"

export default async function Page({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;
  const serie = await serieById(id);
  const books = await bookList();

  if (!serie) {
    return <div>Sem Série disponíveis.</div>;
  }

  return (
    <>
      <main>
        <UpdateSerie id={id} books={books} serie={serie}/>
      </main>
    </>
  );
}
