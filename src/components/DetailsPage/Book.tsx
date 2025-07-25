"use client";

import ReturnBtn from "../ReturnBtn";
import Image from "next/image";
import clsx from "clsx";
import { Database } from "@/utils/typings/supabase";
import { formatDate } from "@/utils/formatDate";
import { renderRating } from "@/utils/renderRating";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/16/solid";

type Book = Database["public"]["Tables"]["book"]["Row"];
type Serie = Database["public"]["Tables"]["serie"]["Row"];
type Quote = Database["public"]["Tables"]["quote"]["Row"];

type BookWithSerie = Book & {
  serie: Serie | null;
  quote: Quote[];
};

interface DetailsBookProps {
  book: BookWithSerie[];
  imageUrl: string;
}

const BookDetails = ({ book, imageUrl }: DetailsBookProps) => {
  const router = useRouter();

  if (!book?.[0]) {
    return (
      <div className="min-h-screen bg-[#F5F0E4] flex items-center justify-center relative overflow-hidden">
        <div className="fantasy-block fantasy-frame p-8 max-w-md w-full text-center relative z-10">
          <span className="fantasy-ornament text-2xl">❧</span>
          <h1 className="text-3xl font-bold text-[#5D4037] mb-6 font-serif">
            Livro não encontrado
          </h1>
          <p className="text-[#8D6E63] mb-6">
            O livro que você procura não está disponível na biblioteca.
          </p>
          <div className="mt-4">
            {/* <ReturnBtn href="/book" btnText="Voltar para a lista" /> */}
            <button
              type="button"
              onClick={() => router.back()}
              className={clsx(
                "inline-flex items-center gap-2 text-[#7F4B30] hover:text-[#F3E2C7]"
              )}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Voltar para a lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 py-12 px-4 sm:px-6 lg:px-8 font-serif relative overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-6">
          {/* <ReturnBtn href="/book" btnText="Voltar para a lista" /> */}
          <button
            type="button"
            onClick={() => router.back()}
            className={clsx(
              "inline-flex items-center gap-2 text-[#7F4B30] hover:text-[#F3E2C7]"
            )}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar para a lista
          </button>
        </div>

        <div className="fantasy-block fantasy-frame no-hover bg-white/95 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
          <div className="p-2 md:p-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Book Cover */}
              <div className="md:w-2/5 lg:w-1/3 p-4 flex flex-col items-center">
                <div className="relative w-88 h-[605px] fantasy-cover transition-transform duration-500 hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-[#8B5A2B] rounded-lg transform -rotate-1 shadow-2xl"></div>
                  <div className="relative w-full h-full overflow-hidden rounded-lg border-4 border-[#5D4037] shadow-lg">
                    <Image
                      src={imageUrl}
                      alt={`Capa do livro ${book[0].title}`}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                </div>

                {/* Library and Reading Info */}
                <div className="mt-8 w-88 mx-auto transform transition-all duration-300 hover:scale-[1.01]">
                  <div className="library-card p-6 bg-white/90 rounded-xl border-2 border-amber-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300">
                    {/* Informações da Biblioteca */}
                    {book[0].library ? (
                      <div className="relative pb-4 mb-4 border-b border-amber-100">
                        <div className="text-xs tracking-wide text-amber-700/90 mb-1">
                          Na biblioteca desde:
                        </div>
                        <div className="text-sm font-medium text-gray-800">
                          {formatDate(book[0].acquisition_date)}
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}

                    {/* Status de Leitura */}
                    <div className="mt-2">
                      <div className="text-xs tracking-wide text-amber-700/90 mb-2">
                        Status de Leitura
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start justify-between rounded-lg">
                          <div>
                            <span
                              className={clsx(
                                "inline-block px-2 py-0.5 rounded text-xs font-semibold align-middle font-serif text-[#F3E2C7] capitalize",
                                {
                                  "bg-[#D35230]": book[0].status === "finish",
                                  "bg-[#2B4A73]": book[0].status === "reading",
                                  "bg-[#B28B2B]": book[0].status === "tbr",
                                  "bg-[#8B3737]":
                                    book[0].status === "abandoned",
                                }
                              )}
                            >
                              {book[0].status}
                            </span>
                          </div>

                          {(book[0].init_date || book[0].finish_date) && (
                            <div className="space-y-1 p-2 rounded-lg">
                              <div className="space-y-1">
                                {book[0].init_date && (
                                  <p className="text-xs text-gray-700">
                                    <span className="font-medium">Início:</span>{" "}
                                    {formatDate(book[0].init_date)}
                                  </p>
                                )}
                                {book[0].finish_date && (
                                  <p className="text-xs text-gray-700">
                                    <span className="font-medium">
                                      Término:
                                    </span>{" "}
                                    {formatDate(book[0].finish_date)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {book[0].current_page !== null &&
                          book[0].current_page !== 0 && (
                            <div className="rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">
                                Progresso
                              </p>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-700">
                                  Página {book[0].current_page} de{" "}
                                  {book[0].pages || "?"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {book[0].pages
                                    ? Math.round(
                                        (book[0].current_page / book[0].pages) *
                                          100
                                      )
                                    : 0}
                                  %
                                </span>
                              </div>
                              {book[0].pages && (
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-amber-500 h-2 rounded-full"
                                    style={{
                                      width: `${
                                        (book[0].current_page / book[0].pages) *
                                        100
                                      }%`,
                                    }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                    {/* Destaque de canto */}
                    <div className="highlight"></div>
                  </div>
                </div>
              </div>

              {/* Book Details */}
              <div className="w-full p-4 md:p-8">
                <div className="relative">
                  <h1 className="text-4xl md:text-5xl font-bold text-[#5D4037] mb-3 leading-tight font-serif">
                    <span className="fantasy-ornament text-3xl mr-2">❧</span>
                    {book[0].title}
                    <span className="fantasy-ornament text-3xl ml-2">❧</span>
                  </h1>

                  <p className="text-2xl text-[#8D6E63] mb-6 font-medium italic">
                    por {book[0].author || "Autor desconhecido"}
                  </p>
                  {book[0].rating !== null && book[0].rating > 0 ? (
                    <div className="mb-8 mt-6 bg-[#FFF8E1] p-4 rounded-lg border border-amber-100 relative">
                      <div className="absolute -top-3 left-6 bg-amber-100 px-3 py-1 rounded-full text-sm text-amber-800 font-medium">
                        Avaliação
                      </div>
                      <div className="flex items-center">
                        <span className="text-3xl text-amber-500">
                          {renderRating(book[0].rating)}
                        </span>
                        <span className="ml-4 text-2xl font-bold text-amber-700">
                          {book[0].rating.toFixed(1)}
                          <span className="text-lg font-normal text-amber-600">
                            /5.0
                          </span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-8 mt-6 bg-amber-50/50 p-4 rounded-lg border border-amber-100/50 relative">
                      <div className="absolute -top-3 left-6 bg-amber-100/80 px-3 py-1 rounded-full text-sm text-amber-800/80 font-medium">
                        Avaliação
                      </div>
                      <div className="flex items-center text-amber-700/70">
                        <span className="text-lg">Sem avaliação</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Collection Info */}
                {book[0].serie?.serie_name && (
                  <div className="border-t border-amber-100 pt-8 mt-8">
                    <div className="fantasy-section mb-8">
                      <h3 className="fantasy-section-title">
                        <span className="fantasy-ornament mr-2">✦</span>
                        Série
                        <span className="fantasy-ornament ml-2">✦</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {book[0].serie?.serie_name && (
                          <div>
                            <p className="text-sm text-gray-600">Série</p>
                            <p className="font-medium">
                              {book[0].serie.serie_name}
                            </p>
                          </div>
                        )}
                        {book[0].volume && (
                          <div>
                            <p className="text-sm text-gray-600">Volume</p>
                            <p className="font-medium">{book[0].volume}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Publishing Info */}
                {book[0].language || book[0].pages || book[0].version ? (
                  <div className="border-t border-amber-100 pt-8 mt-8">
                    <div className="fantasy-section mb-8">
                      <h3 className="fantasy-section-title">
                        <span className="fantasy-ornament mr-2">✧</span>
                        Informações do Livro
                        <span className="fantasy-ornament ml-2">✧</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 [&>div]:bg-white/50 [&>div]:p-3 [&>div]:rounded-lg [&>div]:transition-all [&>div]:duration-200 [&>div:hover]:bg-white [&>div:hover]:shadow-sm">
                        {book[0].pages && (
                          <div>
                            <p className="text-sm text-gray-600">Páginas</p>
                            <p className="font-medium">{book[0].pages}</p>
                          </div>
                        )}
                        {book[0].language && (
                          <div>
                            <p className="text-sm text-gray-600">Idioma</p>
                            <p className="font-medium capitalize">
                              {book[0].language === "pt"
                                ? "Português"
                                : book[0].language === "en"
                                ? "Inglês"
                                : book[0].language === "es"
                                ? "Espanhol"
                                : "Desconhecido"}
                            </p>
                          </div>
                        )}
                        {book[0].version && (
                          <div>
                            <p className="text-sm text-gray-600">Edição</p>
                            <p className="font-medium capitalize">
                              {book[0].version}
                            </p>
                          </div>
                        )}
                        {book[0].category && (
                          <div>
                            <p className="text-sm text-gray-600">Categoria</p>
                            <p className="font-medium">{book[0].category}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p>Sem informações adicionais</p>
                  </>
                )}

                {/* Minhas Anotações */}
                <div className="border-t border-amber-100 pt-8 mt-8">
                  <div className="mt-6 p-6 bg-white/90 rounded-xl border border-amber-100">
                    <h3 className="text-xl font-semibold text-amber-900 mb-4 flex items-center">
                      <span className="w-8 h-1 bg-amber-400 mr-3"></span>
                      Minhas Anotações
                      <span className="w-8 h-1 bg-amber-400 ml-3 flex-grow"></span>
                    </h3>
                    <div className="relative">
                      {book[0].comments ? (
                        <p className="text-amber-900 whitespace-pre-line text-lg leading-relaxed pl-6 border-l-4 border-amber-300">
                          {book[0].comments}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic text-center py-4">
                          Nenhuma anotação cadastrada para este livro.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Citações */}
          <div className="w-full px-2 md:px-6 pb-6">
            <div className="w-full border-t border-amber-100 pt-10 mt-10">
              <h3 className="text-2xl font-bold text-[#5D4037] flex items-center mb-6">
                <span className="fantasy-ornament mr-2">❧</span>
                Citações
                <span className="fantasy-ornament ml-2">❧</span>
              </h3>

              {book[0] && book[0].quote.length > 0 ? (
                <div className="space-y-6">
                  {book[0].quote.map((quote) => (
                    <div
                      key={quote.id}
                      className="relative p-6 bg-gradient-to-br from-[#FFF8E1] to-[#FFECB3] rounded-xl border-2 border-amber-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
                    >
                      <div className="absolute top-4 left-4 text-4xl text-amber-200 font-serif">
                        "
                      </div>
                      <p className="text-lg text-gray-800 pl-8 pr-4 py-2 italic">
                        {quote.quote}
                      </p>
                      {quote.page && (
                        <p className="text-right text-gray-500 text-sm mt-2">
                          — Página {quote.page}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-amber-50 rounded-lg border-2 border-dashed border-amber-200">
                  <p className="text-gray-600">
                    Nenhuma citação cadastrada para este livro.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
