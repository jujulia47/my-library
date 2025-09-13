import ReadBook from "@/components/Read/Book/ReadBook"
import SideMenu from "@/components/SideMenu"
import Search from "@/components/Search/Search"
import { searchBooks } from "@/services/book"
import Link from "next/link"


interface PageProps {
  searchParams: {
    [key: string]: string | string[] | undefined
  }
}

export default async function BookPage(
  { searchParams }: PageProps
) {
  console.log(searchParams, "searchParams");

  const search =
    typeof searchParams.search === "string" ? searchParams.search : "";

  console.log(search, "search");

  const searchedBooks = await searchBooks(search ? search : "", 1000);
  console.log(searchedBooks, "searchedBooks");

  return (
    <div>
      <section className="fixed z-40">
        <SideMenu />
      </section>
      <section className="ml-64">
        <Search
          searchedBooks={searchedBooks}
        />
        <ReadBook
          searchParams={searchParams}
          searchedBooks={searchedBooks}
        />
      </section>
    </div>
  );
}
