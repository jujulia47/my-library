"use client";

import ReturnBtn from "../ReturnBtn";
import { Database } from "@/utils/typings/supabase";
import { formatDate } from "@/utils/formatDate";

type Quote = Database["public"]["Tables"]["quote"]["Row"];
type Book = Database["public"]["Tables"]["book"]["Row"];

type QuoteWithBook = Quote & {
  book: Book | null;
};

interface QuoteProps {
  quote: QuoteWithBook[];
}

const DetailsQuotePage = ({ quote }: QuoteProps) => {
  if (!quote?.[0]) {
    return (
      <div className="min-h-screen bg-[#F5F0E4] flex items-center justify-center relative overflow-hidden">
        <div className="fantasy-block fantasy-frame p-8 max-w-md w-full text-center relative z-10">
          <span className="fantasy-ornament text-2xl">❧</span>
          <h1 className="text-3xl font-bold text-[#5D4037] mb-6 font-serif">
            Citação não encontrada
          </h1>
          <p className="text-[#8D6E63] mb-6">
            A citação que você procura não está disponível.
          </p>
          <div className="mt-4">
            <ReturnBtn href="/quote" btnText="Voltar para a lista" />
          </div>
        </div>
      </div>
    );
  }

  const currentQuote = quote[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-2">
          <ReturnBtn href="/quote" btnText="Voltar para a lista" />
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-amber-100/50 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-amber-200/70 font-[ui-serif,Georgia,Cambria,'Times New Roman',Times,serif]">
          {/* Decoração sutil no topo */}
          <div className="h-1.5 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300"></div>
          
          <div className="p-8 md:p-10">
            {/* Cabeçalho com ícone de livro */}
            <div className="mb-10 group">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-amber-100/50 rounded-lg text-amber-600 group-hover:bg-amber-200/50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-medium text-amber-900 leading-tight mb-1.5 group-hover:text-amber-800 transition-colors">
                    {currentQuote.book?.title || 'Citação'}
                  </h1>
                  {currentQuote.book?.author && (
                    <p className="text-amber-700/80 italic flex items-center gap-1.5">
                      {currentQuote.book.author}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Citação com destaque */}
            <div className="mb-12 relative">
              <div className="absolute -left-1 top-0 h-full w-1 bg-gradient-to-b from-amber-300 to-amber-400 rounded-full"></div>
              <blockquote className="text-lg md:text-xl text-amber-900 font-light leading-relaxed italic pl-6 [&>p]:my-1 font-serif">
                <span className="text-4xl text-amber-200/80 mr-2 -ml-2 -mt-2 inline-block h-0">"</span>
                <span className="relative -top-1 tracking-wider">{currentQuote.quote}</span>
                <span className="text-4xl text-amber-200/80 ml-1 -mr-2 -mb-2 inline-block h-0">"</span>
              </blockquote>
            </div>

            {/* Rodapé com informações adicionais */}
            <div className="pt-6 border-t border-amber-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4">                
                {currentQuote.page && (
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-100/70 hover:bg-amber-200/50 rounded-full text-amber-800 text-sm font-medium transition-colors cursor-default">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Página {currentQuote.page}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsQuotePage;