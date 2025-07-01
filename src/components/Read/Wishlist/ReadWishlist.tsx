import { wishlistList } from "@/services/wishlist";
import Link from "next/link";
import DeleteWishlistBtn from "./DeleteWishlist";

export default async function ReadWishlist() {
  const wishlist = await wishlistList();

  if (!wishlist) {
    return;
  }

  return wishlist.length > 0 ? (
    <section className="min-h-screen py-10 px-2 font-serif bg-[#E1D9C9]">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold mb-4 text-center">Wishlist</h3>
          <Link
            href="/create/wishlist"
            className="px-4 py-2 bg-[#424C21] text-[#E1D9C9] rounded font-bold"
          >
            New Wishlist Book
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
                  Título
                </th>
                <th
                  className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[#212E40]"
                  style={{ fontSize: "13px" }}
                >
                  Autor(a)
                </th>
                <th
                  className="px-4 py-3 text-center font-bold uppercase tracking-wider text-[#212E40]"
                  style={{ fontSize: "13px" }}
                >
                  Série
                </th>
                <th
                  className="px-4 py-3 text-center font-bold uppercase tracking-wider text-[#212E40]"
                  style={{ fontSize: "13px" }}
                >
                  Volume
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
              {wishlist?.map((wishlist, idx) => (
                <tr
                  key={wishlist.id}
                  className="border-b last:border-b-0"
                  style={{
                    borderColor: "#AE9372",
                    background: idx % 2 === 0 ? "#fff" : "bg-[#E1D9C9]",
                  }}
                >
                  {/* titulo */}
                  <td
                    className="px-4 py-3 text-[#173125] whitespace-nowrap font-medium"
                    style={{ fontSize: "15px" }}
                  >
                    {wishlist.book_name}
                  </td>
                  {/* autor */}
                  <td
                    className="px-4 py-3 text-[#424C21] whitespace-nowrap"
                    style={{ fontSize: "15px" }}
                  >
                    {wishlist.author}
                  </td>

                  <td
                    className="px-4 py-3 text-center whitespace-nowrap"
                    style={{ fontSize: "15px" }}
                  >
                    {wishlist.serie_id ? (
                      <span
                        className="flex items-center justify-center gap-0.5"
                        aria-label={`Avaliação: ${wishlist.rating} de 5`}
                      >
                        {wishlist.serie?.serie_name}
                      </span>
                    ) : (
                      <span className="text-[#B27D57]">-</span>
                    )}
                  </td>

                  <td
                    className="px-4 py-3 text-center whitespace-nowrap"
                    style={{ fontSize: "15px" }}
                  >
                    {wishlist.volume ? (
                      <span
                        className="flex items-center justify-center gap-0.5"
                        aria-label={`Avaliação: ${wishlist.rating} de 5`}
                      >
                        {wishlist.volume}
                      </span>
                    ) : (
                      <span className="text-[#B27D57]">-</span>
                    )}
                  </td>
                  {/* ações */}
                  <td className="px-4 py-3 whitespace-nowrap flex gap-3 items-center justify-center">
                    {/* Editar */}
                    <Link
                      href={`/wishlist/${wishlist.id}`}
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
                      href={`/wishlist/view/${wishlist.id}`}
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
                    <DeleteWishlistBtn id={wishlist.id} />
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
