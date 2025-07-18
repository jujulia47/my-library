"use client";

import ReturnBtn from "../ReturnBtn";
import Image from "next/image";
import clsx from "clsx";
import { Database } from "@/utils/typings/supabase";
import { formatDate, calculateDuration, calculateDaysSince } from "@/utils/formatDate";
import { renderRating } from "@/utils/renderRating";


type Book = Database["public"]["Tables"]["book"]["Row"];
type Serie = Database["public"]["Tables"]["serie"]["Row"];

type BookWithVolume = Book & { volume: number | null };

type SerieWithBooks = Serie & {
  book: BookWithVolume[];
};

type DetailsSerieProps = {
  serie: SerieWithBooks[];
  booksInfos: {
    id: number;
    title: string;
    volume: number | null;
    rating: number | null;
    status: string;
    cover: string;
    author: string;
  }[];
};

const DetailsSeriePage = ({ serie, booksInfos }: DetailsSerieProps) => {
  console.log(booksInfos, "booksInfos");

  if (!serie?.[0]) {
    return (
      <div className="min-h-screen bg-[#F5F0E4] flex items-center justify-center relative overflow-hidden">
        <div className="fantasy-block fantasy-frame p-8 max-w-md w-full text-center relative z-10">
          <span className="fantasy-ornament text-2xl">❧</span>
          <h1 className="text-3xl font-bold text-[#5D4037] mb-6 font-serif">
            Série não encontrada
          </h1>
          <p className="text-[#8D6E63] mb-6">
            A série que você procura não está disponível na biblioteca.
          </p>
          <div className="mt-2">
            <ReturnBtn href="/serie" btnText="Voltar para a lista" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 py-12 px-4 sm:px-6 lg:px-8 font-serif relative overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-2">
          <ReturnBtn href="/serie" btnText="Voltar para a lista" />
        </div>

        <div className="fantasy-block fantasy-frame no-hover bg-white/95 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
          <div className="p-2 md:p-6">
            <div className="flex-col md:flex-row gap-8">
              {/* Book Details */}
              <div className="w-full p-4">
                <div className="relative">
                  <h1 className="text-4xl md:text-5xl font-bold text-[#5D4037] mb-3 leading-tight font-serif">
                    <span className="fantasy-ornament text-3xl mr-2">❧</span>
                    {serie[0].serie_name}
                    <span className="fantasy-ornament text-3xl ml-2">❧</span>
                  </h1>
                  {booksInfos.length > 0 ? (
                    <p className="text-2xl text-[#8D6E63] mb-6 font-medium italic">
                      por {booksInfos[0].author}
                    </p>
                  ) : (
                    <p className="text-2xl text-[#8D6E63] mb-6 font-medium italic">
                      por Autor desconhecido
                    </p>
                  )}

                  {serie[0].rating !== null && serie[0].rating > 0 ? (
                    <div className="mb-8 mt-6 bg-[#FFF8E1] p-4 rounded-lg border border-amber-100 relative">
                      <div className="absolute -top-3 left-6 bg-amber-100 px-3 py-1 rounded-full text-sm text-amber-800 font-medium">
                        Avaliação
                      </div>
                      <div className="flex items-center">
                        <span className="text-3xl text-amber-500">
                          {renderRating(serie[0].rating)}
                        </span>
                        <span className="ml-4 text-2xl font-bold text-amber-700">
                          {serie[0].rating.toFixed(1)}
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


              </div>
              <div className="flex gap-8 justify-between w-full">
                {/* Serie Cover */}
                <div className="md:w-2/5 lg:w-2/5 flex flex-col items-center">
                  {/* Library and Reading Info */}
                  <div className="w-full transform transition-all duration-300 hover:scale-[1.01]">
                    <div className="library-card p-6 bg-white/90 rounded-xl border-2 border-amber-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300">
                      {/* Informações da Série */}
                      <div className="space-y-5">
                        {/* Cabeçalho */}
                        <div className="text-center mb-4">
                          <div className="text-amber-800 text-lg font-bold mb-1">
                            Série com {serie[0].qty_volumes} volumes
                          </div>
                          <div className={clsx(
                            "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                            {
                              "bg-green-100 text-green-800": serie[0].collection_complete,
                              "bg-yellow-100 text-yellow-800": !serie[0].collection_complete
                            }
                          )}>
                            <span className="mr-1">
                              {serie[0].collection_complete ? "✓" : "!"}
                            </span>
                            {serie[0].collection_complete ? "Coleção completa" : "Coleção incompleta"}
                          </div>
                        </div>
                        {/* Estatísticas */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                            <div className="flex items-center text-amber-700 mb-1">
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <span className="text-xs font-medium">Volumes</span>
                            </div>
                            <div className="text-xl font-bold text-amber-800">
                              {serie[0].qty_volumes}
                            </div>
                          </div>
                          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                            <div className="flex items-center text-amber-700 mb-1">
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-xs font-medium">Lidos</span>
                            </div>
                            <div className="text-xl font-bold text-amber-800">
                              {serie[0].book.filter(b => b.status === 'finish').length}
                            </div>
                          </div>
                        </div>
                        {/* Progresso de Leitura */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-amber-900 flex items-center">
                              <svg className="w-4 h-4 mr-1.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Progresso de Leitura
                            </h4>
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                              {Math.round((serie[0].book.filter(b => b.status === 'finish').length / (serie[0].qty_volumes || 1)) * 100)}% concluído
                            </span>
                          </div>
                          <div className="relative pt-1">
                            <div className="flex items-center justify-between text-xs text-amber-700 mb-1">
                              <span>{serie[0].book.filter(b => b.status === 'finish').length} de {serie[0].qty_volumes || 0} volumes</span>
                              <span>{Math.round((serie[0].book.filter(b => b.status === 'finish').length / (serie[0].qty_volumes || 1)) * 100)}%</span>
                            </div>
                            <div className="overflow-hidden h-2.5 rounded-full bg-amber-100">
                              <div
                                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500 ease-out"
                                style={{
                                  width: `${serie[0].qty_volumes ? (serie[0].book.filter(b => b.status === 'finish').length / serie[0].qty_volumes) * 100 : 0}%`,
                                  minWidth: '0.5rem'
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        {/* Datas */}
                        <div className="space-y-3 pt-2 border-t border-amber-100">
                          <h4 className="text-sm font-medium text-amber-900 flex items-center">
                            <svg className="w-4 h-4 mr-1.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Datas
                          </h4>
                          <div className="space-y-2 pl-5 relative">
                            {/* Linha decorativa */}
                            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-amber-100"></div>
                            {serie[0].init_date && (
                              <div className="relative">
                                <div className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-amber-400 border-2 border-amber-100"></div>
                                <div className="text-xs text-amber-700/80">Iniciada em</div>
                                <div className="text-sm font-medium text-amber-800">
                                  {formatDate(serie[0].init_date)}
                                </div>
                              </div>
                            )}
                            {serie[0].finish_date && (
                              <div className="relative">
                                <div className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-amber-500 border-2 border-amber-100"></div>
                                <div className="text-xs text-amber-700/80">Finalizada em</div>
                                <div className="text-sm font-medium text-amber-800">
                                  {formatDate(serie[0].finish_date)}
                                </div>
                                {serie[0].init_date && (
                                  <div className="text-xs text-amber-600/80 mt-1">
                                    {calculateDuration(serie[0].init_date, serie[0].finish_date)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Status de Leitura */}
                      <div className="mt-2">
                        <div className="text-xs tracking-wide text-amber-700/90 mb-2">
                          Status de Leitura
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between rounded-lg">
                            <div>
                              <span
                                className={clsx(
                                  "inline-block px-2 py-0.5 rounded text-xs font-semibold align-middle font-serif text-[#F3E2C7] capitalize",
                                  {
                                    "bg-[#D35230]": serie[0].status === "finish",
                                    "bg-[#2B4A73]": serie[0].status === "reading",
                                    "bg-[#B28B2B]": serie[0].status === "tbr",
                                    "bg-[#8B3737]": serie[0].status === "abandoned",
                                  }
                                )}
                              >
                                {serie[0].status}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 italic">
                              {serie[0].status === 'finish' && 'Série finalizada'}
                              {serie[0].status === 'reading' && (
                                <>
                                  Em andamento
                                  {serie[0].init_date && (
                                    <div className="text-amber-700 mt-1">
                                      Lendo há {calculateDaysSince(serie[0].init_date)}
                                    </div>
                                  )}
                                </>
                              )}
                              {serie[0].status === 'tbr' && 'Na lista de leitura'}
                              {serie[0].status === 'abandoned' && 'Série abandonada'}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Destaque de canto */}
                      <div className="highlight"></div>
                    </div>
                  </div>
                </div>
                {/* Lista de Livros da Série */}
                <div className="md:w-2/5 lg:w-3/5 flex flex-col items-center">
                  <div className="w-full">
                    {booksInfos.length !== 0 ? (
                      <div className="p-6 bg-white/90 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-amber-900 mb-6 font-serif border-b pb-2">
                          Livros da Série
                        </h2>
                        <div className="flex flex-wrap gap-1 max-h-[411px] overflow-y-auto custom-scrollbar">
                          {booksInfos.map((book) => (
                            <div key={book.id} className="flex flex-col items-center group mb-6 w-[150px]">
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
                                  ): (
                                    <></>
                                  )}
                                  {book.status && (
                                    <div className="mt-1">
                                      <span
                                        className={clsx(
                                          "inline-block px-2 py-0.5 rounded text-xs font-semibold align-middle font-serif text-[#F3E2C7] capitalize",
                                          {
                                            "bg-[#D35230]": book.status === "finish",
                                            "bg-[#2B4A73]": book.status === "reading",
                                            "bg-[#B28B2B]": book.status === "tbr",
                                            "bg-[#8B3737]": book.status === "abandoned",
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
                    ) : (
                      <div className="p-6 bg-white/90 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-amber-900 mb-6 font-serif border-b pb-2">
                          Livros da Série
                        </h2>
                        <div className="flex flex-wrap gap-6">
                          <p className="text-sm text-base text-amber-900 line-clamp-2">
                            Nenhum livro encontrado.
                          </p>
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
    </div>
  );
};

export default DetailsSeriePage;