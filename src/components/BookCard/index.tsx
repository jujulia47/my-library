"use client"

import Image from 'next/image'
import { Database } from '@/utils/typings/supabase'
import { calculateDaysSince } from '@/utils/formatDate'
import Link from 'next/link'
import { imagesUrl } from '@/services/images'

type Book = Database['public']['Tables']['book']['Row']

const BookCard = ({ book }: { book: Book }) => {
  const progressPercentage = ((book.current_page! / book.pages!) * 100).toFixed(0)
  const daysReading = calculateDaysSince(book.init_date ?? "")
  const pagesLeft = book.pages! - book.current_page!

  return (
    <Link href={`/book/${book.slug}`} className="block group w-full max-w-full mx-auto">
      <div className="bg-sand/80 rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md h-full flex border border-stone-200">
        {/* Book Cover */}
        <div className="relative w-[120px] h-[180px] flex-shrink-0">
          <Image
            src={imagesUrl(book.cover!)}
            alt={`Capa do livro ${book.title}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-102"
            sizes="(max-width: 768px) 120px, 120px"
          />
        </div>

        {/* Book Info */}
        <div className="p-2 flex-1 flex flex-col min-w-0 justify-around">
          <div>
            <h3 className="font-medium text-ochre text-sm line-clamp-2 group-hover:text-coffee transition-colors leading-tight">
              {book.title}
            </h3>
            <p className="text-ochre/80 text-sm font-medium">{book.author}</p>
          </div>
          
          {/* Reading Progress */}
          <div className="mt-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-coffee/80 mb-1">
                  <span>Progresso</span>
                  <span className="font-bold text-blue">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-stone-200/70 rounded-full h-1.5 mt-0.5 overflow-hidden">
                  <div 
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${progressPercentage}%`,
                      background: `linear-gradient(90deg, 
                        ${parseInt(progressPercentage) < 30 ? '#f59e0b' : 
                          parseInt(progressPercentage) < 70 ? '#d97706' : '#b45309'}, 
                        ${parseInt(progressPercentage) < 30 ? '#fcd34d' : 
                          parseInt(progressPercentage) < 70 ? '#fbbf24' : '#f59e0b'})`
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-1.5">
              <div className="text-xs text-ochre/90">
                {book.current_page}/{book.pages} pág.
              </div>
              
              <div className="flex items-center gap-1.5">
                {daysReading && (
                  <span className="text-xs text-coffee font-medium">
                    {daysReading}
                  </span>
                )}
                <span 
                  className={`inline-block text-xs px-2 py-0.5 rounded border ${
                    book.status === 'reading' 
                      ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' 
                      : 'bg-blue/10 text-blue border-blue/20'
                  }`}
                >
                  {book.status}
                </span>
              </div>
            </div>
            {/* Ver detalhes link */}
            <div className="text-left">
              <span className="inline-block text-xs text-ochre/80 font-medium hover:text-ochre transition-colors">
                Ver detalhes →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default BookCard