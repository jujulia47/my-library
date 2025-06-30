import UpdateQuote from "@/components/Update/Quote";
import { bookList } from "@/services/book";
import { quoteById } from "@/services/quotes"

export default async function Page({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;
  const quote = await quoteById(id);
  const books = await bookList();

  if (!quote) {
    return <div>Sem citações disponíveis.</div>;
  }

  return (
    <>
      <main>
        <UpdateQuote id={id} books={books} quote={quote}/>
      </main>
    </>
  );
}
