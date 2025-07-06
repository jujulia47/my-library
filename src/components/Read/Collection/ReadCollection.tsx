import { collectionList } from "@/services/collections";
import Link from "next/link";
import DeleteCollectionBtn from "../Collection/DeleteCollection";
import EmptyTable from "@/components/EmptyTable";

export default async function ReadCollection() {
  const collection = await collectionList();

  if (!collection) {
    return;
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#F3E2C7]">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 mt-8 px-4 max-w-4xl w-full mx-auto">
        <h3 className="text-3xl font-bold text-[#7F4B30] font-serif text-center sm:text-left">
          Coleções cadastradas
        </h3>
        <Link
          href="/create/collection"
          className="px-6 py-2 bg-[#424C21] text-[#F3E2C7] rounded font-bold shadow hover:bg-[#7F4B30] transition-colors"
        >
          Nova Coleção
        </Link>
      </div>
      {collection.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyTable
            message="Nenhuma coleção cadastrada."
            href="/create/collection"
            btnText="Cadastrar primeira coleção"
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
                      Coleção
                    </th>
                    <th
                      className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[#F3E2C7] bg-[#7F4B30]"
                      style={{ fontSize: "13px" }}
                    >
                      Data Início
                    </th>
                    <th
                      className="px-4 py-3 text-center font-bold uppercase tracking-wider text-[#F3E2C7] bg-[#7F4B30]"
                      style={{ fontSize: "13px" }}
                    >
                      Data Fim
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
                  {collection?.map((collection, idx) => (
                    <tr
                      key={collection.id}
                      className="border-b last:border-b-0"
                      style={{
                        borderColor: "#AE9372",
                        background: idx % 2 === 0 ? "#fff" : "bg-[#F3E2C7]",
                      }}
                    >
                      {/* Coleção */}
                      <td
                        className="px-4 py-3 text-[#173125] whitespace-nowrap font-medium"
                        style={{ fontSize: "15px" }}
                      >
                        {collection.collection_name}
                      </td>
                      {/* Data Início */}
                      <td
                        className="px-4 py-3 text-center whitespace-nowrap"
                        style={{ fontSize: "15px" }}
                      >
                        <span className="text-[13px] text-[#A05C41] font-normal font-serif">
                          {collection.init_date
                            ? new Date(
                                collection.init_date
                              ).toLocaleDateString()
                            : "-"}
                        </span>
                      </td>
                      {/* Data Fim */}
                      <td
                        className="px-4 py-3 text-center whitespace-nowrap"
                        style={{ fontSize: "15px" }}
                      >
                        <span className="text-[13px] text-[#A05C41] font-normal font-serif">
                          {collection.finish_date
                            ? new Date(
                                collection.finish_date
                              ).toLocaleDateString()
                            : "-"}
                        </span>
                      </td>
                      {/* ações */}
                      <td className="px-4 py-3 whitespace-nowrap flex gap-3 items-center justify-center">
                        {/* Editar */}
                        <Link
                          href={`/collection/${collection.id}`}
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
                          href={`/quote/view/${collection.id}`}
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
                        <DeleteCollectionBtn id={collection.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
