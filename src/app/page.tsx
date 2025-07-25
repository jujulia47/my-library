// import Image from "next/image";

import SideMenu from "@/components/SideMenu";
import "./fantasy.css";
import { bookList } from "@/services/book";
import {serieList} from '@/services/serie'
import {collectionList} from '@/services/collections'
import Link from "next/link";
import BookCard from "@/components/BookCard";
import CollectionCard from "@/components/CollectionCard";

export default async function Home() {
  const books = await bookList();
  const series = await serieList();
  const collections = await collectionList();

  const booksFinishDates = books?.map((book) => book.finish_date);
  const seriesFinishDates = series?.map((serie) => {
    const date = serie.finish_date ? new Date(serie.finish_date) : null;
    const status = serie.status
    if(status === 'finish' && date?.getUTCFullYear() === 2025) {
      return date
    }
    return null
  })
  const seriesFinish = seriesFinishDates?.filter((date) => date !== null).length;
  const seriesReading = series?.filter((serie) => serie.status === 'reading' && serie.init_date ? new Date(serie.init_date)?.getUTCFullYear() === 2025 : null).length;

  const booksReading = books?.filter((book) => book.status === 'reading');
  const booksAbandoned = books?.filter((book) => book.status === 'abandoned' && book.init_date ? new Date(book.init_date)?.getUTCFullYear() === 2025 : null).length;

  const challengesOngoing = collections?.filter(
    (collection) =>
      collection.type_collection === 'challenge' &&
      collection.status === 'ongoing' &&
      collection.init_date &&
      new Date(collection.init_date).getUTCFullYear() === 2025
    );

  const challengesFinished = collections?.filter(
    (collection) =>
      collection.type_collection === 'challenge' &&
      collection.status === 'finished' &&
      collection.init_date &&
      new Date(collection.init_date).getUTCFullYear() === 2025
  ).length;

  const meses = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  const bookByMonth: { [monthName: string]: number } = {};

  booksFinishDates?.forEach((finishDate) => {
    const date = finishDate ? new Date(finishDate) : null;
    if (date && date.getUTCFullYear() === 2025) {
      const monthIndex = date.getMonth();
      console.log(monthIndex, 'monthIndex');

      const monthName = meses[monthIndex];
      console.log(monthName, 'monthName');

      bookByMonth[monthName] = (bookByMonth[monthName] || 0) + 1;
      console.log(bookByMonth, 'bookByMonth');
    }
  });

  const monthResult = meses.map((month) => ({
    month,
    qty: bookByMonth[month] || 0,
  }));

  return (
    <main className="min-h-screen ml-64 items-center justify-center fantasy-bg">
      {/* SVG de partículas mágicas animadas */}
      <div className="fantasy-particles-anim" aria-hidden="true">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          className="particles-svg"
        >
          {/* Partículas mágicas */}
          {Array.from({ length: 30 }).map((_, i) => (
            <circle
              key={i}
              cx={`${Math.random() * 100}`}
              cy={`${Math.random() * 100}`}
              r={Math.random() * 0.3 + 0.1}
              fill="#d9b76f"
              opacity="0.7"
            >
              <animate
                attributeName="cy"
                values={`${Math.random() * 100};${Math.random() * 100}`}
                dur={`${Math.random() * 15 + 10}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="cx"
                values={`${Math.random() * 100};${Math.random() * 100}`}
                dur={`${Math.random() * 20 + 15}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values={`${Math.random() * 0.3 + 0.2};${Math.random() * 0.8 + 0.2
                  }`}
                dur={`${Math.random() * 5 + 3}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </svg>
      </div>
      <section className="fixed z-40">
        <SideMenu />
      </section>

      {/* Título e citação no topo */}
      <div className="w-full flex flex-col items-center justify-center mt-2 mb-8 relative">
        <h1 className="text-5xl md:text-6xl font-bold fantasy-title mb-4 text-center">
          <span className="fantasy-ornament">✧</span>
          Bem-vindo à Biblioteca
          <span className="fantasy-ornament">✧</span>
        </h1>
        <blockquote className="mx-auto max-w-2xl text-center fantasy-quote">
          <p className="text-xl leading-relaxed">
            ‘É um negócio perigoso, Frodo, sair da sua porta.
            <br />
            Você pisa na estrada, e, se não controlar seus pés, não há como saber até onde você pode ser levado’
          </p>
          <footer className="mt-4 text-right text-lg font-medium">
            — J.R.R. Tolkien
          </footer>
        </blockquote>
      </div>

      {/* Resumo do Ano: linha inteira abaixo da citação */}
      <section className="w-full max-w-5xl mx-auto px-2 mb-8">
        <div className="fantasy-block fantasy-frame fantasy-hover flex flex-col gap-6 relative">
          <span
            className="fantasy-stars"
            style={{ left: 12, top: 8, right: "auto", position: "absolute" }}
          >
            ✧
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#7F4B30] flex items-center gap-2 mb-2">
            <span className="text-3xl" role="img" aria-label="Calendário">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="inline-block"
              >
                <path
                  d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
                  fill="#8B5A2B"
                  fillOpacity="0.9"
                  stroke="#5D4037"
                  strokeWidth="1"
                />
                <path
                  d="M3 9H21V6C21 4.89543 20.1046 4 19 4H5C3.89543 4 3 4.89543 3 6V9Z"
                  fill="#C19A6B"
                  stroke="#5D4037"
                  strokeWidth="0.5"
                />
                <path
                  d="M7 2V5"
                  stroke="#5D4037"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M17 2V5"
                  stroke="#5D4037"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M8 13H16"
                  stroke="#F5F1E6"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
                <path
                  d="M8 17H14"
                  stroke="#F5F1E6"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
                <path
                  d="M8 13H11"
                  stroke="#8B5A2B"
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                <path
                  d="M8 17H11"
                  stroke="#8B5A2B"
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                <path
                  d="M12 13H15"
                  stroke="#8B5A2B"
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                <path
                  d="M12 17H15"
                  stroke="#8B5A2B"
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </svg>
            </span>{" "}
            Resumo do Ano
            <span className="fantasy-ornament ml-2">✶</span>
          </h2>
          <div className="flex flex-wrap gap-6 justify-center">
            <div className="flex flex-col items-center justify-between">
              <span className="text-4xl font-bold text-[#7F4B30]">{monthResult.reduce((total, item) => total + item.qty, 0)}</span>
              <span className="text-[#bfa16f] mt-1">Livros lidos</span>
            </div>
            <div className="flex flex-col items-center justify-between">
              <span className="text-3xl font-bold text-[#7F4B30]">{seriesReading}</span>
              <span className="text-[#bfa16f] mt-1">Séries em andamento</span>
            </div>
            <div className="flex flex-col items-center justify-between">
              <span className="text-3xl font-bold text-[#7F4B30]">{seriesFinish}</span>
              <span className="text-[#bfa16f] mt-1">Séries concluídas</span>
            </div>
            <div className="flex flex-col items-center justify-between">
              <span className="text-3xl font-bold text-[#7F4B30]">{challengesOngoing?.length}</span>
              <span className="text-[#bfa16f] mt-1">Desafios em andamento</span>
            </div>
            <div className="flex flex-col items-center justify-between">
              <span className="text-3xl font-bold text-[#7F4B30]">{challengesFinished}</span>
              <span className="text-[#bfa16f] mt-1">Desafios concluídos</span>
            </div>
            <div className="flex flex-col items-center justify-between">
              <span className="text-3xl font-bold text-[#7F4B30]">{booksAbandoned}</span>
              <span className="text-[#bfa16f] mt-1">Livros abandonados</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {monthResult.map(({ month, qty }) => (
              <a
                key={month}
                href="#"
                className={`flex flex-col items-center px-4 py-2 bg-amber-50/80 rounded border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all duration-300 text-amber-900 cursor-pointer hover:scale-105 hover:shadow-md ${qty === 0 ? "opacity-50 pointer-events-none" : ""
                  }`}
                title={
                  qty === 0
                    ? `Nenhum livro lido em ${month}`
                    : `Ver livros lidos em ${month}`
                }
              >
                <span className="font-bold text-lg">{month}</span>
                <span className="text-sm">{qty}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Ornamento decorativo abaixo do título e convite à aventura */}
      <div className="mt-1 mb-3 text-center">
        <span className="text-2xl fantasy-ornament">✶ ✷ ✹ ✵</span>
      </div>
      <div className="mb-7 text-center">
        <span className="text-lg italic text-[#7F4B30] fantasy-title">
          Cada página é um portal para outros mundos. Pronto para sua próxima
          jornada?
        </span>
      </div>

      {/* Ícone temático entre Resumo do Ano e os blocos seguintes */}
      <div className="flex justify-center mb-3">
        <span className="text-3xl" role="img" aria-label="Pena mágica">
          🪶
        </span>
      </div>

      {/* Coleções e Lendo agora: lado a lado abaixo do resumo */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center gap-6">
          {/* Seção de Coleções */}
          <div className="fantasy-block fantasy-frame relative transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 min-w-1/2 gap-4">
            {challengesOngoing?.length && challengesOngoing?.length > 0 ? (
              challengesOngoing?.map((challenge) => (
                <CollectionCard key={challenge.id} collection={challenge} />
              ))
            ) : (
              
              <div>
                <span
                  className="fantasy-stars"
                  style={{ right: 16, top: 12, position: "absolute" }}
                >
                ✷
              </span>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-amber-900 mb-4 flex items-center gap-3 justify-center">
                <span>Coleções</span>
                <span className="fantasy-ornament ml-1">✹</span>
              </h2>
              <div className="w-full min-h-[120px] bg-amber-50/80 border-2 border-dashed border-amber-200 rounded-lg flex items-center justify-center text-amber-900 italic fantasy-quote p-4 text-center">
                <p className="leading-relaxed">
                  <span className="block text-lg font-medium mb-1">
                    Bem-vindo à sua biblioteca!
                  </span>
                  <span className="text-sm">
                    Comece adicionando sua primeira coleção.
                  </span>
                </p>
              </div>
              <div className="mt-4 text-center">
                <button className="btn transform transition-all duration-300 hover:scale-105 flex items-center mx-auto">
                  <span className="mr-2">Explorar</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
            )}
          </div>

          {/* Seção de Lendo Agora */}
          <div className="fantasy-block fantasy-frame relative transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1 min-w-1/2 gap-4">
          {booksReading?.length && booksReading?.length > 0 ? (
            booksReading?.map((book) => (
              <BookCard key={book.id} book={book} />
            ))
          ): (

            <div>
              <span
                className="fantasy-stars"
                style={{ left: 16, top: 12, position: "absolute" }}
              >
                ✵
              </span>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-amber-900 mb-4 flex items-center gap-3 justify-center">
                <span>Lendo agora</span>
                <span className="fantasy-ornament ml-1">✧</span>
              </h2>
              <div className="w-full min-h-[120px] bg-amber-50/80 border-2 border-dashed border-amber-200 rounded-lg flex items-center justify-center text-amber-900 italic fantasy-quote p-4">
                <p className="text-center">
                  <span className="block text-lg font-medium mb-1">
                    Nenhum livro em leitura
                  </span>
                  <span className="text-sm">
                    Adicione um livro para começar sua jornada.
                  </span>
                </p>
              </div>
              <div className="mt-4 text-center">
                <button className="btn transform transition-all duration-300 hover:scale-105 flex items-center mx-auto">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <Link href="/book/new">Adicionar Livro</Link>
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </section>

      {/* Rodapé Temático */}
      <footer className="w-full py-6 mt-12 border-t border-amber-200 bg-amber-50/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <span className="font-serif text-amber-900 text-lg hover-glow">
                Biblioteca da Terra Média
              </span>
            </div>
            <div className="flex space-x-6">
              <a
                href="#"
                className="text-amber-800 hover:text-amber-600 transition-colors hover-glow"
                data-tooltip="Conheça nossa história"
              >
                Sobre
              </a>
              <a
                href="#"
                className="text-amber-800 hover:text-amber-600 transition-colors hover-glow"
                data-tooltip="Entre em contato conosco"
              >
                Contato
              </a>
              <a
                href="#"
                className="text-amber-800 hover:text-amber-600 transition-colors hover-glow"
                data-tooltip="Termos de uso e privacidade"
              >
                Termos
              </a>
            </div>
          </div>
          <div className="mt-6 text-center md:text-left text-sm text-amber-700">
            <p>
              © {new Date().getFullYear()} Sua Biblioteca. Todos os direitos
              reservados.
            </p>
            <p className="mt-1 text-xs opacity-75 flex items-center justify-center md:justify-start gap-1">
              <span>Criado com</span>
              <span
                className="text-rose-500 hover:animate-pulse"
                role="img"
                aria-label="coração"
              >
                ♥
              </span>
              <span>e boas histórias</span>
            </p>
          </div>
        </div>

        {/* Elemento decorativo no rodapé */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-200 to-transparent opacity-30"></div>
      </footer>

    </main>
  );
}
