import { quoteList } from "@/services/quotes";
import Link from "next/link";
import EmptyTable from "@/components/EmptyTable";
import ReadTable from "@/components/ReadTable";
import { deleteQuote } from "@/actions/deleteQuote";

export default async function ReadQuote() {
  const quote = await quoteList();

  if (!quote) {
    return;
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#F3E2C7]">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 mt-8 px-4 max-w-4xl w-full mx-auto">
        <h3 className="text-3xl font-bold text-[#7F4B30] font-serif text-center sm:text-left">
          Citações cadastradas
        </h3>
        <Link
          href="/quote/new"
          className="px-6 py-2 bg-[#424C21] text-[#F3E2C7] rounded font-bold shadow hover:bg-[#7F4B30] transition-colors"
        >
          Nova Citação
        </Link>
      </div>
      {quote.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyTable
            message="Nenhuma citação cadastrada ainda."
            href="/quote/new"
            btnText="Cadastrar primeira citação"
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
            <ReadTable<"quote">
              headers={["Citação", "Livro", "Página", "Ações"]}
              fields={["quote", "book_id", "page"]}
              data={quote}
              action={deleteQuote}
              message="Certeza que deseja excluir esta citação?"
              route="quote"
              dataName="quote"
            />
          </div>
        </div>
      </section>
      )}
    </main>
  );
}
