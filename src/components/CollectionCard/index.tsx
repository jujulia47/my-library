'use client'

import { calculateDuration, calculateDaysSince } from "@/utils/formatDate"
import { Database } from "@/utils/typings/supabase"

type Collection = Database['public']['Tables']['collection']['Row']

const calculateDaysUntil = (endDate: string): string => {
  const today = new Date();
  const end = new Date(endDate);

  // Ajusta para o fuso horário UTC para evitar problemas com horário de verão
  const utcToday = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );

  const utcEnd = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate()
  );

  // Calcula a diferença em dias
  const diffMs = utcEnd - utcToday;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'amanhã';
  if (diffDays < 0) return `há ${Math.abs(diffDays)} dias`;

  return `${diffDays}`;
};

const CollectionCard = ({ collection }: { collection: Collection }) => {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-sand/80 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-stone-200">
      <div className="absolute inset-0 bg-gradient-to-br from-ochre/80 to-coffee/60 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>

      <div className="p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-xl font-bold text-forest group-hover:text-ochre transition-colors duration-300 font-serif">
              {collection.collection_name}
            </h2>
            {collection.description && (
              <p className="text-forest/90 mb-4 line-clamp-3 font-serif">
                {collection.description}
              </p>
            )}
            <div className="flex items-center text-sm text-ochre/90">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="rgb(217, 119, 6)">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {collection.init_date ? new Date(collection.init_date).toLocaleDateString('pt-BR') : ''}
                {collection.finish_date ? ` - ${new Date(collection.finish_date).toLocaleDateString('pt-BR')}` : ''}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            {collection.init_date && collection.finish_date && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 border border-amber-500/20 mb-1">
                {calculateDuration(collection.init_date, collection.finish_date)}
              </span>
            )}
            {collection.finish_date && new Date(collection.finish_date) > new Date() && (
              <div className="flex items-center text-xs text-moss">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="rgb(217, 119, 6)">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Termina em <span style={{ color: 'rgb(217, 119, 6)' }}>{calculateDaysUntil(collection.finish_date)}</span> dias
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default CollectionCard