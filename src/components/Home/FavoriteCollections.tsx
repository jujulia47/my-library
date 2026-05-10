import Link from "next/link";
import { StarIcon } from "@heroicons/react/24/solid";
import {
  CollectionTypeBadge,
  collectionTypeLabels,
} from "@/components/ui";
import { HomeCard, HomeCardEmpty } from "./HomeCard";
import type { FavoriteCollection } from "@/services/homeData";

type Props = {
  data: FavoriteCollection[];
};

export function FavoriteCollections({ data }: Props) {
  return (
    <HomeCard
      title="Coleções favoritas"
      icon={<StarIcon className="w-3.5 h-3.5" />}
    >
      {data.length === 0 ? (
        <HomeCardEmpty>
          Sem coleções favoritas. Marque uma com ★ pra aparecer aqui.
        </HomeCardEmpty>
      ) : (
        <ul className="space-y-3">
          {data.map((col) => {
            // Subscription não tem barra: progresso linear não faz sentido
            // (assinatura é eterna até cancelar).
            const showBar = col.type !== "subscription";
            return (
              <li key={col.id}>
                <Link
                  href={`/collection/${col.slug}`}
                  className="block p-1.5 rounded-md hover:bg-paper-soft transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-xs font-medium text-ink-deep truncate group-hover:text-gold-deep transition-colors flex-1 min-w-0">
                      {col.name}
                    </p>
                    <span className="flex-shrink-0">
                      <CollectionTypeBadge type={col.type} />
                    </span>
                  </div>
                  <p className="text-[10px] italic text-ink-fade mt-0.5">
                    {col.subtitle}
                  </p>
                  {showBar && (
                    <div
                      className="h-0.5 bg-paper-soft rounded-full overflow-hidden mt-1.5"
                      aria-hidden
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          col.is_completed ? "bg-moss" : "bg-gold"
                        }`}
                        style={{ width: `${col.progress_percent}%` }}
                      />
                    </div>
                  )}
                  <span className="sr-only">
                    Tipo: {collectionTypeLabels[col.type]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </HomeCard>
  );
}
