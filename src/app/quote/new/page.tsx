import CreateQuote from "@/components/Create/Quote";
import { bookList } from "@/services/book"

export default async function CreateQuotePage() {
  const books = await bookList();

  return (
    <>
      <main>
        < CreateQuote books={books}/>
      </main>
    </>
  );
}
