
import { bookList } from "@/services/book";
import Link from "next/link";
import DeleteBookBtn from "./DeleteBook/index";
import clsx from "clsx";
import Pagination from "@/components/Pagination/Pagination";
import EmptyTable from "@/components/EmptyTable";
import { getPagination } from "@/utils/getPagination";

export default async function ReadBook({
  searchParams, 
  searchedBooks,
}: {
  searchParams?: { page?: string | string[] };
  searchedBooks: any[];
}) {
  console.log("searchParams Read Book", searchParams);
  console.log("searchedBooks Read Book", searchedBooks);

  // Busca os livros do servidor
  const books = await bookList();

  if (!books) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3E2C7] p-8">
        <p className="text-lg">Não foi possível carregar os livros. Tente novamente mais tarde.</p>
      </div>
    );
  }

  const { currentItems, validPage, totalPages } = await getPagination({
    items: searchedBooks.length > 0 ? searchedBooks : books,
    searchParams,
    itemsPerPage: 20,
    baseUrl: "/book",
  });

  return (
    <>
      <main className="min-h-screen flex flex-col bg-[#F3E2C7] p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 mt-8 px-4 max-w-4xl w-full mx-auto">
          <h3 className="text-3xl font-bold text-[#7F4B30] font-serif text-center sm:text-left">
            Livros cadastrados
          </h3>
          <Link
            href="/book/new"
            className="px-6 py-2 bg-[#424C21] text-[#F3E2C7] rounded font-bold shadow hover:bg-[#7F4B30] transition-colors"
          >
            Novo Livro
          </Link>
        </div>
        {books.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyTable
              message="Nenhum livro cadastrado ainda."
              href="/book/new"
              btnText="Cadastrar primeiro livro"
              svg={
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 120 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mb-6"
                >
                  <rect
                    x="10"
                    y="20"
                    width="100"
                    height="80"
                    rx="12"
                    fill="#F3E2C7"
                    stroke="#A05C41"
                    strokeWidth="3"
                  />
                  <rect
                    x="20"
                    y="30"
                    width="80"
                    height="60"
                    rx="8"
                    fill="#fff"
                    stroke="#B28B2B"
                    strokeWidth="2"
                  />
                  <rect
                    x="35"
                    y="45"
                    width="50"
                    height="8"
                    rx="2"
                    fill="#EAD9C1"
                  />
                  <rect
                    x="35"
                    y="60"
                    width="30"
                    height="6"
                    rx="2"
                    fill="#EAD9C1"
                  />
                </svg>
              }
            />
          </div>
        ) : (
          <section className="flex-1 flex flex-col justify-center px-2 font-serif bg-[#F3E2C7]">
            <div className="w-full max-w-5xl mx-auto">
              <div className="overflow-x-auto rounded-xl shadow-lg bg-[#F3E2C7]">
                <table className="min-w-full text-base rounded-xl border border-[#A05C41] bg-[#F3E2C7]">
                  <thead>
                    <tr className="bg-[#C48A6A]">
                      <th
                        className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[#F3E2C7] bg-[#7F4B30] rounded-tl-xl"
                        style={{ fontSize: "13px" }}
                      >
                        Título
                      </th>
                      <th
                        className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[#F3E2C7] bg-[#7F4B30]"
                        style={{ fontSize: "13px" }}
                      >
                        Autor
                      </th>
                      <th
                        className="px-4 py-3 text-center font-bold uppercase tracking-wider text-[#F3E2C7] bg-[#7F4B30]"
                        style={{ fontSize: "13px" }}
                      >
                        Status
                      </th>
                      <th
                        className="px-4 py-3 text-center font-bold uppercase tracking-wider text-[#F3E2C7] bg-[#7F4B30]"
                        style={{ fontSize: "13px" }}
                      >
                        Avaliação
                      </th>
                      <th
                        className="px-4 py-3 text-center font-bold uppercase tracking-wider text-[#F3E2C7] bg-[#7F4B30] rounded-tr-xl"
                        style={{ fontSize: "13px" }}
                      >
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems?.map((book, idx) => (
                      <tr
                        key={book.id}
                        className="border-b last:border-b-0"
                        style={{
                          borderColor: "#AE9372",
                          background: idx % 2 === 0 ? "#fff" : "bg-[#F3E2C7]",
                        }}
                      >
                        {/* titulo */}
                        <td
                          className="px-4 py-3 text-[#173125] whitespace-nowrap font-medium"
                          style={{ fontSize: "15px" }}
                        >
                          {book.title}
                        </td>
                        {/* autor */}
                        <td
                          className="px-4 py-3 text-[#A05C41] whitespace-nowrap max-w-[180px] line-clamp-1 text-ellipsis"
                          style={{ fontSize: "15px" }}
                        >
                          {book.author}
                        </td>
                        {/* status */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {book.status === "reading" ? (
                            <div className="relative inline-block group">
                              <span
                                className={clsx(
                                  "inline-block px-2 py-0.5 rounded text-xs font-semibold align-middle font-serif transition-transform duration-150 text-[#F3E2C7] cursor-pointer hover:scale-105",
                                  "bg-[#2B4A73] capitalize"
                                )}
                              >
                                {book.status}
                              </span>
                              {/* Tooltip só aparece no hover */}
                              <div className="absolute z-10 hidden group-hover:flex flex-col gap-2 bg-[#F6F3ED] border-l-4 border-[#B27D57] p-4 rounded shadow-lg bottom-full left-1/2 -translate-x-1/2 mb-2 w-max transition-all duration-300">
                                <div className="flex gap-3 items-center">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B3A29] font-serif">
                                    Início da leitura:
                                  </span>
                                  <span className="text-[13px] text-[#A05C41] font-normal font-serif">
                                    {book.init_date
                                      ? new Date(
                                        book.init_date
                                      ).toLocaleDateString()
                                      : "-"}
                                  </span>
                                </div>
                                <div className="flex gap-3 items-center">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B3A29] font-serif">
                                    Página atual:
                                  </span>
                                  <span className="text-[13px] text-[#A05C41] font-normal font-serif">
                                    {book.current_page ?? "-"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span
                              className={clsx(
                                "inline-block px-2 py-0.5 rounded text-xs font-semibold align-middle font-serif text-[#F3E2C7] capitalize",
                                {
                                  "bg-[#D35230]": book.status === "finish",
                                  "bg-[#B28B2B]": book.status === "tbr",
                                  "bg-[#8B3737]": book.status === "abandoned",
                                }
                              )}
                            >
                              {book.status}
                            </span>
                          )}
                        </td>
                        {/* avaliacao */}
                        <td
                          className="px-4 py-3 text-center whitespace-nowrap"
                          style={{ fontSize: "15px" }}
                        >
                          {book.rating ? (
                            <span
                              className="flex items-center justify-center gap-0.5"
                              aria-label={`Avaliação: ${book.rating} de 5`}
                            >
                              {Array.from({ length: 5 }).map((_, i) => (
                                <svg
                                  key={i}
                                  width="14"
                                  height="14"
                                  viewBox="0 0 20 20"
                                  fill={
                                    i < Number(book.rating) ? "#B28B2B" : "none"
                                  }
                                  stroke="#B28B2B"
                                  strokeWidth="1.2"
                                  aria-hidden="true"
                                  style={{
                                    display: "inline",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  <polygon points="10,2 12.5,7.5 18.5,8 14,12 15.5,18 10,15 4.5,18 6,12 1.5,8 7.5,7.5" />
                                </svg>
                              ))}
                            </span>
                          ) : (
                            <span className="text-[#B27D57]">-</span>
                          )}
                        </td>
                        {/* ações */}
                        <td className="px-4 py-3 whitespace-nowrap flex gap-3 items-center justify-center">
                          {/* Editar */}
                          <Link
                            href={`/book/edit/${book.id}`}
                            className="p-1.5 rounded transition hover:bg-[#B27D57]/10"
                            aria-label="Editar"
                            title="Editar"
                          >
                            <svg
                              width="20"
                              height="20"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="#7F4B30"
                              strokeWidth="1.8"
                            >
                              <path d="M15.232 5.232l3.536 3.536M9 13l6.293-6.293a1 1 0 011.414 0l1.586 1.586a1 1 0 010 1.414L11 15H9v-2z" />
                              <path
                                d="M19 19H5a2 2 0 01-2-2V5a2 2 0 012-2h7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </Link>
                          {/* Visualizar */}
                          <Link
                            href={`/book/${book.slug}`}
                            className="p-1.5 rounded transition hover:bg-[#7F4B30]/10"
                            aria-label="Visualizar"
                            title="Visualizar"
                          >
                            <svg
                              width="20"
                              height="20"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="#424C21"
                              strokeWidth="1.8"
                            >
                              <path d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12 18 19.5 12 19.5 1.5 12 1.5 12z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </Link>
                          {/* Excluir */}
                          <DeleteBookBtn id={book.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* responsável pela numeração/botões*/}
            <Pagination
              currentPage={validPage}
              totalPages={totalPages}
            />
          </section>
        )}
      </main>
    </>
  );
}
