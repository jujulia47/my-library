import { quoteList } from "@/services/quotes";
import Link from "next/link";
import DeleteBtn from "./DeleteBtn";
import { deleteQuote } from "@/actions/deleteQuote";

export default async function ReadQuote() {
  const quote = await quoteList();

  return (
    <section className="min-h-screen py-10 px-2 font-serif bg-[#E1D9C9]">
      <h3 className="text-2xl font-bold mb-4 text-center">Quotes</h3>
      <div className="max-w-4xl mx-auto">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm rounded-xl border border-[#AE9372] bg-[#E1D9C9]">
            <thead>
              <tr className="bg-[#AE9372]">
                <th
                  className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[#212E40] rounded-tl-xl"
                  style={{ fontSize: "13px" }}
                >
                  Citação
                </th>
                <th
                  className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[#212E40]"
                  style={{ fontSize: "13px" }}
                >
                  Livro
                </th>
                <th
                  className="px-4 py-3 text-center font-bold uppercase tracking-wider text-[#212E40]"
                  style={{ fontSize: "13px" }}
                >
                  Página
                </th>

                <th
                  className="px-4 py-3 text-center font-bold uppercase tracking-wider text-[#212E40] rounded-tr-xl"
                  style={{ fontSize: "13px" }}
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {quote?.map((quote, idx) => (
                <tr
                  key={quote.id}
                  className="border-b last:border-b-0"
                  style={{
                    borderColor: "#AE9372",
                    background: idx % 2 === 0 ? "#fff" : "bg-[#E1D9C9]",
                  }}
                >
                  {/* Citação */}
                  <td
                    className="px-4 py-3 text-[#173125] whitespace-nowrap font-medium"
                    style={{ fontSize: "15px" }}
                  >
                    {quote.quote}
                  </td>
                  {/* Livro */}
                  <td
                    className="px-4 py-3 text-[#424C21] whitespace-nowrap"
                    style={{ fontSize: "15px" }}
                  >
                    {quote.book_id}
                  </td>

                  <td
                    className="px-4 py-3 text-center whitespace-nowrap"
                    style={{ fontSize: "15px" }}
                  >
                    {quote.page ? (
                      <span
                        className="flex items-center justify-center gap-0.5"
                        aria-label={`Avaliação: ${quote.page} de 5`}
                      >
                        {quote.page}
                      </span>
                    ) : (
                      <span className="text-[#B27D57]">-</span>
                    )}
                  </td>
                  {/* ações */}
                  <td className="px-4 py-3 whitespace-nowrap flex gap-3 items-center justify-center">
                    {/* Editar */}
                    <Link
                      href={`/quote/${quote.id}`}
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
                      href={`/quote/view/${quote.id}`}
                      className="p-1.5 rounded transition hover:bg-[#424C21]/10"
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
                    <DeleteBtn id={quote.id} action={deleteQuote} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
