import { bookList } from "@/services/book";
import Link from "next/link";
import DeleteBookBtn from "./DeleteBtn";

export default async function ReadBook() {
  const books = await bookList();

  return (
    <>
      {books?.map((book) => {
        return (<div key={book.id}>
          <p key={book.id}>{book.title}</p>
          <Link href={`/book/${book.id}`}>
            Editar
          </Link>
          <DeleteBookBtn id={book.id}/>
        </div>);
      })}
    </>
  );
}
