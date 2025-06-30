import { serieList } from "@/services/serie";
import Link from "next/link";
import clsx from "clsx";
import DeleteSerieBtn from "./DeleteSerie";

export default async function ReadBook() {
  const series = await serieList();

  if (!series) {
    return;
  }

  return series.length > 0 ? (
    <section className="min-h-screen py-10 px-2 font-serif bg-[#E1D9C9]">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold mb-4 text-center">Series</h3>
          <Link
            href="/create/serie"
            className="px-4 py-2 bg-[#424C21] text-[#E1D9C9] rounded font-bold"
          >
            New Serie
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm rounded-xl border border-[#AE9372] bg-[#E1D9C9]">
            <thead>
              <tr className="bg-[#AE9372]">
                <th
                  className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[#212E40] rounded-tl-xl"
                  style={{ fontSize: "13px" }}
                >
                  Série
                </th>
                <th
                  className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[#212E40]"
                  style={{ fontSize: "13px" }}
                >
                  Volumes
                </th>
                <th
                  className="px-4 py-3 text-center font-bold uppercase tracking-wider text-[#212E40]"
                  style={{ fontSize: "13px" }}
                >
                  Status
                </th>
                <th
                  className="px-4 py-3 text-center font-bold uppercase tracking-wider text-[#212E40]"
                  style={{ fontSize: "13px" }}
                >
                  Avaliação
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
              {series?.map((serie, idx) => (
                <tr
                  key={serie.id}
                  className="border-b last:border-b-0"
                  style={{
                    borderColor: "#AE9372",
                    background: idx % 2 === 0 ? "#fff" : "bg-[#E1D9C9]",
                  }}
                >
                  {/* Nome da série */}
                  <td
                    className="px-4 py-3 text-[#173125] whitespace-nowrap font-medium"
                    style={{ fontSize: "15px" }}
                  >
                    {serie.serie_name}
                  </td>
                  {/* Quantidade de volumes */}
                  <td
                    className="px-4 py-3 text-[#424C21] whitespace-nowrap"
                    style={{ fontSize: "15px" }}
                  >
                    {serie.qty_volumes}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {serie.status === "reading" ? (
                      <div className="relative inline-block group">
                        <span
                          className={clsx(
                            "inline-block px-2 py-0.5 rounded text-xs font-semibold align-middle font-serif transition-transform duration-150 text-[#E1D9C9] cursor-pointer hover:scale-105",
                            "bg-[#2B4A73]"
                          )}
                        >
                          {serie.status}
                        </span>

                        {/* Tooltip só aparece no hover */}
                        <div className="absolute z-10 hidden group-hover:flex flex-col gap-2 bg-[#F6F3ED] border-l-4 border-[#B27D57] p-4 rounded shadow-lg bottom-full left-1/2 -translate-x-1/2 mb-2 w-max transition-all duration-300">
                          <div className="flex gap-3 items-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#212E40] font-serif">
                              Início da leitura:
                            </span>
                            <span className="text-[13px] text-[#424C21] font-normal font-serif">
                              {serie.init_date
                                ? new Date(serie.init_date).toLocaleDateString()
                                : "-"}
                            </span>
                          </div>

                          <div className="flex gap-3 items-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#212E40] font-serif">
                              Volume atual:
                            </span>
                            <span className="text-[13px] text-[#424C21] font-normal font-serif">
                              {serie.current_book_id ?? "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span
                        className={clsx(
                          "inline-block px-2 py-0.5 rounded text-xs font-semibold align-middle font-serif text-[#E1D9C9]",
                          {
                            "bg-[#424C21]": serie.status === "finish",
                            "bg-[#B28B2B]": serie.status === "tbr",
                            "bg-[#8B3737]": serie.status === "abandoned",
                          }
                        )}
                      >
                        {serie.status}
                      </span>
                    )}
                  </td>
                  {/* Avaliação */}
                  <td
                    className="px-4 py-3 text-center whitespace-nowrap"
                    style={{ fontSize: "15px" }}
                  >
                    {serie.rating ? (
                      <span
                        className="flex items-center justify-center gap-0.5"
                        aria-label={`Avaliação: ${serie.rating} de 5`}
                      >
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            width="14"
                            height="14"
                            viewBox="0 0 20 20"
                            fill={i < Number(serie.rating) ? "#B28B2B" : "none"}
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

                  {/* Ações */}
                  <td className="px-4 py-3 whitespace-nowrap flex gap-3 items-center justify-center">
                    {/* Editar */}
                    <Link
                      href={`/serie/${serie.id}`}
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
                      href={`/serie/view/${serie.id}`}
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
                    <DeleteSerieBtn id={serie.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  ) : (
    <></>
  );
}
