import CreateSerie from "@/components/Create/Serie";
import { bookList } from "@/services/book";

export default async function CreateSeriePage() {
  const books = await bookList();
  return (
    <>
      <main>
        < CreateSerie books={books}/>
      </main>
    </>
  );
}
