"use client";

import ReturnBtn from "../ReturnBtn";
import Image from "next/image";
import clsx from "clsx";
import { Database } from "@/utils/typings/supabase";
import {
  formatDate,
  calculateDuration,
  calculateDaysSince,
} from "@/utils/formatDate";
import { renderRating } from "@/utils/renderRating";

type Collection = Database["public"]["Tables"]["collection"]["Row"];
type Book = Database["public"]["Tables"]["book"]["Row"];
type Serie = Database["public"]["Tables"]["serie"]["Row"];
type Wishlist = Database["public"]["Tables"]["wishlist"]["Row"];

type CollectionBookWithBook = {
  id: number;
  book_id: number;
  book: Book | null;
};

type CollectionSerieWithSerie = {
  id: number;
  serie_id: number;
  serie: Serie | null;
};

type CollectionWishlistWithWishlist = {
  id: number;
  wishlist_id: number;
  wishlist: Wishlist | null;
};

type CollectionWithRelations = Collection & {
  collection_book: CollectionBookWithBook[];
  collection_serie: CollectionSerieWithSerie[];
  collection_wishlist: CollectionWishlistWithWishlist[];
};

type DetailsCollectionProps = {
  collection: CollectionWithRelations[];
  booksInfos: {
    id: number;
    title: string;
    volume: number | null;
    rating: number | null;
    status: string;
    cover: string;
    author: string;
  }[];
  seriesInfos: {
    id: number;
    serie_name: string | null;
    qty_volumes: number | null;
    status: string | null;
    rating: number | null;
  }[];
  wishlistInfos: {
    id: number;
    title: string;
    volume: number | null;
    rating: number | null;
    status: string;
    author: string;
    cover: string;
  }[];
};

const DetailsCollectionPage = ({
  collection,
  booksInfos,
  seriesInfos,
  wishlistInfos,
}: DetailsCollectionProps) => {
  console.log(collection, "collection");

  if (!collection) {
    return (
      <div className="min-h-screen bg-[#F5F0E4] flex items-center justify-center relative overflow-hidden">
        <div className="fantasy-block fantasy-frame p-8 max-w-md w-full text-center relative z-10">
          <span className="fantasy-ornament text-2xl">❧</span>
          <h1 className="text-3xl font-bold text-[#5D4037] mb-6 font-serif">
            Coleção não encontrada
          </h1>
          <p className="text-[#8D6E63] mb-6">
            A coleção que você procura não está disponível na biblioteca.
          </p>
          <div className="mt-2">
            <ReturnBtn href="/collection" btnText="Voltar para a lista" />
          </div>
        </div>
      </div>
    );
  }

  // Add custom animation for the blob effect
  const style = `
    @keyframes blob {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -30px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    .animate-blob { animation: blob 7s infinite; }
    .animation-delay-2000 { animation-delay: 2s; }
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-50 to-amber-100 py-12 px-4 sm:px-6 lg:px-8 font-serif relative overflow-hidden transition-colors duration-300">
      <style>{style}</style>
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-10"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-200 to-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-amber-200 to-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-2">
          <ReturnBtn
            href="/collection"
            btnText="Voltar para a lista"
            className="text-amber-800 hover:text-amber-900 border-amber-200"
          />
        </div>

        <div className="fantasy-block fantasy-frame no-hover bg-white/95 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 border-amber-100 rounded-2xl">
          <div className="p-2 md:p-6">
            <div className="flex-col md:flex-row gap-8">
              {/* Collections Details */}
              <div className="w-full p-4">
                <div className="relative">
                  <h1 className="text-4xl md:text-5xl font-bold text-[#5D4037] mb-3 leading-tight font-serif">
                    <span className="fantasy-ornament text-3xl mr-2">❧</span>
                    {collection[0].collection_name}
                    <span className="fantasy-ornament text-3xl ml-2">❧</span>
                  </h1>
                  {collection[0].description && (
                    <p className="text-xl text-[#8D6E63] mb-6 font-medium italic">
                      {collection[0].description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-8 justify-between w-full">
                <div className="md:w-2/5 lg:w-2/5 flex flex-col items-center">
                  {/* Library and Reading Info */}
                  <div className="w-full transform transition-all duration-300 hover:scale-[1.01]">
                    <div className="library-card p-8 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-2 border-amber-200 shadow-md hover:shadow-xl hover:border-amber-300 transition-all duration-300">
                      {/* Seção de Livros */}
                      <div>
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-2 border-amber-100 shadow-sm flex-col">
                          {booksInfos.length > 0 && (
                            <h3 className="p-5 text-xl font-bold text-amber-900 flex items-center">
                              <svg
                                className="w-5 h-5 mr-2 text-amber-700"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 19.477 5.754 19 7.5 19s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                />
                              </svg>
                              <p className="text-xl font-bold bg-gradient-to-r from-amber-800 to-amber-600 bg-clip-text text-transparent">
                                Livros
                              </p>
                            </h3>
                          )}
                          {/* Estatísticas de Livros */}
                          {booksInfos.length > 0 && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="pl-5">
                                <div className="flex items-center text-amber-700 mb-2">
                                  <div className="p-2 bg-amber-200/50 rounded-lg mr-3">
                                    <svg
                                      className="w-5 h-5 text-amber-700"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 19.477 5.754 19 7.5 19s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                      />
                                    </svg>
                                  </div>
                                  <span className="text-sm font-medium">
                                    <span className="text-base font-bold text-amber-800">
                                      {booksInfos.length}
                                    </span>{" "}
                                    Livros na coleção
                                  </span>
                                </div>
                              </div>
                              <div className="pr-5">
                                <div className="flex items-center text-amber-700 mb-1">
                                  <svg
                                    className="w-4 h-4 mr-1.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span className="text-sm font-medium">
                                    <span className="text-base font-bold text-amber-800">
                                      {
                                        collection[0].collection_book?.filter(
                                          (b) => b.book?.status === "finish"
                                        ).length
                                      }
                                    </span>{" "}
                                    Livros lidos
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Progresso de Leitura - Livros */}
                          {booksInfos.length > 0 && (
                            <div className="space-y-4 p-5">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-medium text-amber-800">
                                  <span className="font-bold text-amber-700">
                                    {Math.round(
                                      (collection[0].collection_book.filter(
                                        (b) => b.book?.status === "finish"
                                      ).length /
                                        collection[0].collection_book.length) *
                                        100
                                    )}
                                    %
                                  </span>
                                </div>
                                <div className="relative pt-1">
                                  <div className="overflow-hidden h-3 mb-2 text-xs flex rounded-full bg-amber-200/50">
                                    <div
                                      style={{
                                        width: `${Math.round(
                                          (collection[0].collection_book.filter(
                                            (b) => b.book?.status === "finish"
                                          ).length /
                                            collection[0].collection_book
                                              .length) *
                                            100
                                        )}%`,
                                      }}
                                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500 ease-out"
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Seção de Séries */}
                        {seriesInfos.length > 0 && (
                          <div className="mt-8">
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-2 border-amber-100 shadow-sm flex-col">
                              <h3 className="p-5 text-xl font-bold text-amber-900 flex items-center">
                                <svg
                                  className="w-5 h-5 mr-2 text-amber-700"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                  />
                                </svg>
                                <p className="text-xl font-bold bg-gradient-to-r from-amber-800 to-amber-600 bg-clip-text text-transparent">
                                  Séries
                                </p>
                              </h3>
                              {/* Estatísticas de Séries */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="pl-5">
                                  <div className="flex items-center text-amber-700 mb-2">
                                    <div className="p-2 bg-amber-200/50 rounded-lg mr-3">
                                      <svg
                                        className="w-5 h-5 text-amber-700"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                        />
                                      </svg>
                                    </div>
                                    <span className="text-sm font-medium">
                                      <span className="text-base font-bold text-amber-800">
                                        {" "}
                                        {collection[0].collection_serie.length}
                                      </span>{" "}
                                      Séries na coleção
                                    </span>
                                  </div>
                                  <div></div>
                                </div>
                                <div className="pr-5">
                                  <div className="flex items-center text-amber-700 mb-2">
                                    <div className="p-2 bg-amber-200/50 rounded-lg mr-3">
                                      <svg
                                        className="w-5 h-5 text-amber-700"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                    </div>
                                    <span className="text-sm font-medium">
                                      <span className="text-base font-bold text-amber-800">
                                        {" "}
                                        {
                                          collection[0].collection_serie.filter(
                                            (s) => s.serie?.status === "finish"
                                          ).length
                                        }
                                      </span>{" "}
                                      Séries concluídas
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {/* Progresso de Leitura - Séries */}
                              <div className="space-y-4 p-5">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs font-base text-amber-800">
                                    <span className="font-bold text-amber-700">
                                      {collection[0].collection_serie.length > 0
                                        ? Math.round(
                                            (collection[0].collection_serie.filter(
                                              (s) =>
                                                s.serie?.status === "finish"
                                            ).length /
                                              collection[0].collection_serie
                                                .length) *
                                              100
                                          )
                                        : 0}
                                      %
                                    </span>
                                  </div>
                                  <div className="relative pt-1">
                                    <div className="overflow-hidden h-3 mb-2 text-xs flex rounded-full bg-amber-200/50">
                                      <div
                                        style={{
                                          width: `${
                                            collection[0].collection_serie
                                              .length > 0
                                              ? Math.round(
                                                  (collection[0].collection_serie.filter(
                                                    (s) =>
                                                      s.serie?.status ===
                                                      "finish"
                                                  ).length /
                                                    collection[0]
                                                      .collection_serie
                                                      .length) *
                                                    100
                                                )
                                              : 0
                                          }%`,
                                        }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500 ease-out"
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Seção de Wishlist */}
                        {wishlistInfos.length > 0 && (
                          <div className="mt-8">
                            <h3 className="p-5 text-xl font-bold text-amber-900 flex items-center">
                              <svg
                                className="w-5 h-5 mr-2 text-amber-700"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                              </svg>
                              <span className="text-xl font-bold bg-gradient-to-r from-amber-800 to-amber-600 bg-clip-text text-transparent">
                                Lista de Desejos
                              </span>
                            </h3>
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl border-2 border-amber-100 shadow-sm">
                              <p className="text-sm font-medium text-amber-700 mt-1">
                                <span className="text-medium font-bold text-amber-800">{wishlistInfos.length}</span> Itens na lista de desejos
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Datas */}
                        <div className="mt-8">
                          <div className="space-y-4 p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-2 border-amber-100 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-semibold text-amber-900 flex items-center">
                                <svg
                                  className="w-5 h-5 mr-2 text-amber-700"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>

                                <span className="text-xl font-bold bg-gradient-to-r from-amber-800 to-amber-600 bg-clip-text text-transparent">
                                  Datas
                                </span>
                              </h4>
                            </div>
                            <div className="relative bg-white/70 p-5 rounded-lg border border-amber-100 shadow-inner">
                              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-300 to-amber-200"></div>
                              <div className="space-y-6">
                                {collection[0].init_date && (
                                  <div className="relative pl-6 group">
                                    <div className="absolute -left-2.5 top-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-amber-100 shadow-md group-hover:scale-110 transition-transform duration-200"></div>
                                    <div className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">
                                      Iniciada em
                                    </div>
                                    <div className="text-base font-semibold text-amber-900 flex items-center">
                                      <span>
                                        {formatDate(collection[0].init_date)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {collection[0].finish_date && (
                                  <div className="relative pl-6 group">
                                    <div className="absolute -left-2.5 top-1 w-4 h-4 rounded-full bg-amber-600 border-2 border-amber-100 shadow-md group-hover:scale-110 transition-transform duration-200">
                                      <div className="absolute inset-0.5 bg-white/20 rounded-full"></div>
                                    </div>
                                    <div className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-1">
                                      Finaliza em
                                    </div>
                                    <div className="text-base font-semibold text-amber-900 mb-1">
                                      {formatDate(collection[0].finish_date)}
                                    </div>
                                    {collection[0].init_date && (
                                      <div className="text-xs font-medium text-amber-700 bg-amber-100/50 px-2.5 py-1 rounded-full inline-flex items-center">
                                        <svg
                                          className="w-3 h-3 mr-1.5"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        {calculateDuration(
                                          collection[0].init_date,
                                          collection[0].finish_date
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Destaque de canto */}
                      <div className="highlight"></div>
                    </div>
                  </div>
                </div>

                <div className="md:w-2/5 lg:w-3/5 flex flex-col items-center gap-8">
                  {/* Lista de Livros da Coleção */}
                  {booksInfos.length !== 0 && (
                    <div className="w-full flex flex-col items-center">
                      <div className="w-full">
                        {seriesInfos.length !== 0 && (
                          <div className="p-6 bg-gradient-to-br from-white to-amber-50 rounded-xl shadow-md border-2 border-amber-100">
                            <h2 className="text-2xl font-bold text-amber-900 mb-6 font-serif border-b pb-2">
                              Livros
                            </h2>
                            <div className="flex gap-6 overflow-y-auto custom-scrollbar">
                              {booksInfos.map((book) => (
                                <div
                                  key={book.id}
                                  className="flex flex-col items-center group mb-6 w-[150px]"
                                >
                                  <div className="relative w-[126px] h-[190px] bg-amber-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform group-hover:-translate-y-1">
                                    {book.cover ? (
                                      <Image
                                        src={book.cover}
                                        alt={`Capa de ${book.title}`}
                                        width={126}
                                        height={190}
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-amber-100">
                                        <span className="text-amber-800 text-sm text-center p-2">
                                          Sem capa
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-3 text-center w-full px-2 w-[160px] h-[90px] flex flex-col justify-between">
                                    <div>
                                      <p className="text-sm text-base text-amber-900 line-clamp-1">
                                        {book.title}
                                      </p>
                                      {book.volume && (
                                        <p className="text-xs text-amber-700">
                                          Vol. {book.volume}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      {book.rating && book.rating != 0 ? (
                                        <div className="mt-1 flex justify-center items-center">
                                          <span className="text-amber-500 text-xs">
                                            {renderRating(book.rating)}
                                          </span>
                                          <span className="ml-1 text-xs text-amber-700">
                                            {book.rating.toFixed(1)}
                                          </span>
                                        </div>
                                      ) : (
                                        <></>
                                      )}
                                      {book.status && (
                                        <div className="mt-1">
                                          <span
                                            className={clsx(
                                              "inline-block px-2 py-0.5 rounded text-xs font-semibold align-middle font-serif text-[#F3E2C7] capitalize",
                                              {
                                                "bg-[#D35230]":
                                                  book.status === "finish",
                                                "bg-[#2B4A73]":
                                                  book.status === "reading",
                                                "bg-[#B28B2B]":
                                                  book.status === "tbr",
                                                "bg-[#8B3737]":
                                                  book.status === "abandoned",
                                              }
                                            )}
                                          >
                                            {book.status}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Lista de Séries da Coleção */}
                  {seriesInfos.length !== 0 && (
                    <div className="w-full flex flex-col items-center">
                      <div className="w-full">
                        {seriesInfos.length !== 0 && (
                          <div className="p-6 bg-white/90 rounded-lg shadow-md">
                            <h2 className="text-2xl font-bold text-amber-900 mb-6 font-serif border-b pb-2">
                              Series
                            </h2>
                            <div className="flex gap-6 overflow-y-auto custom-scrollbar">
                              {seriesInfos.map((serie) => (
                                <div
                                  key={serie.id}
                                  className="group mb-6 w-[200px] min-h-[180px] bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer p-5 relative overflow-hidden border-2 border-amber-100 hover:border-amber-200"
                                >
                                  <div className="w-full h-full flex flex-col justify-between">
                                    <div className="text-center relative z-10">
                                      {/* Series title with gradient text */}
                                      <p className="text-justify text-medium font-semibold bg-gradient-to-r from-amber-800 to-amber-600 bg-clip-text text-transparent line-clamp-2 leading-tight mb-2">
                                        {serie.serie_name}
                                      </p>

                                      {/* Volume count */}
                                      {serie.qty_volumes !== 0 &&
                                        serie.qty_volumes !== null && (
                                          <p className="text-justify text-sm font-medium text-amber-700 mb-3">
                                            {serie.qty_volumes} volume
                                            {serie.qty_volumes > 1 ? "s" : ""}
                                          </p>
                                        )}
                                    </div>

                                    <div className="relative z-10">
                                      {serie.rating && serie.rating !== 0 ? (
                                        <div className="flex justify-left items-center mb-3">
                                          <span className="text-amber-500 text-sm">
                                            {renderRating(serie.rating)}
                                          </span>
                                          <span className="ml-2 text-sm font-medium bg-gradient-to-r from-amber-700 to-amber-600 bg-clip-text text-transparent">
                                            {serie.rating?.toFixed(1)}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="h-5 mb-3"></div>
                                      )}
                                      {serie.status && (
                                        <div className="mt-1">
                                          <span
                                            className={clsx(
                                              "inline-block px-2 py-0.5 rounded text-xs font-semibold align-middle font-serif text-[#F3E2C7] capitalize",
                                              {
                                                "bg-[#D35230]":
                                                  serie.status === "finish",
                                                "bg-[#2B4A73]":
                                                  serie.status === "reading",
                                                "bg-[#B28B2B]":
                                                  serie.status === "tbr",
                                                "bg-[#8B3737]":
                                                  serie.status === "abandoned",
                                              }
                                            )}
                                          >
                                            {serie.status}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Hover effect overlay */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 to-amber-200/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Lista de Wishlist da Coleção */}
                  {wishlistInfos.length !== 0 && (
                    <div className="w-full flex flex-col items-center">
                      <div className="w-full">
                        {seriesInfos.length !== 0 && (
                          <div className="p-6 bg-gradient-to-br from-white to-amber-50 rounded-xl shadow-md border-2 border-amber-100">
                            <h2 className="text-2xl font-bold text-amber-900 mb-6 font-serif border-b pb-2">
                              Wishlist
                            </h2>
                            <div className="flex gap-6 overflow-y-auto custom-scrollbar">
                              {wishlistInfos.map((book) => (
                                <div
                                  key={book.id}
                                  className="flex flex-col items-center group mb-6 w-[150px]"
                                >
                                  <div className="relative w-[126px] h-[190px] bg-amber-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform group-hover:-translate-y-1">
                                    {book.cover ? (
                                      <Image
                                        src={book.cover}
                                        alt={`Capa de ${book.title}`}
                                        width={126}
                                        height={190}
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-amber-100">
                                        <span className="text-amber-800 text-sm text-center p-2">
                                          Sem capa
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-3 text-center w-full px-2 w-[160px] h-[90px] flex flex-col justify-between">
                                    <div>
                                      <p className="text-sm text-base text-amber-900 line-clamp-1">
                                        {book.title}
                                      </p>
                                      {book.volume !== 0 && (
                                        <p className="text-xs text-amber-700">
                                          Vol. {book.volume}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      {book.rating && book.rating != 0 ? (
                                        <div className="mt-1 flex justify-center items-center">
                                          <span className="text-amber-500 text-xs">
                                            {renderRating(book.rating)}
                                          </span>
                                          <span className="ml-1 text-xs text-amber-700">
                                            {book.rating.toFixed(1)}
                                          </span>
                                        </div>
                                      ) : (
                                        <></>
                                      )}
                                      {book.status && (
                                        <div className="mt-1">
                                          <span
                                            className={clsx(
                                              "inline-block px-2 py-0.5 rounded text-xs font-semibold align-middle font-serif text-[#F3E2C7] capitalize",
                                              {
                                                "bg-[#D35230]":
                                                  book.status === "finish",
                                                "bg-[#2B4A73]":
                                                  book.status === "reading",
                                                "bg-[#B28B2B]":
                                                  book.status === "tbr",
                                                "bg-[#8B3737]":
                                                  book.status === "abandoned",
                                              }
                                            )}
                                          >
                                            {book.status}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsCollectionPage;
