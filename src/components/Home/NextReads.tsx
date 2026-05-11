import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { BookCoverFallback } from "@/components/ui";
import { HomeCard, HomeCardEmpty } from "./HomeCard";
import type { NextReadItem } from "@/services/homeData";

type Props = {
  data: NextReadItem[];
};

export function NextReads({ data }: Props) {
  return (
    <HomeCard
      title="Próximas leituras"
      icon={<ArrowRightIcon className="w-3.5 h-3.5" />}
    >
      {data.length === 0 ? (
        <HomeCardEmpty>Sem leituras planejadas.</HomeCardEmpty>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {data.map((item) => (
            <li key={item.id}>
              <Link
                href={`/book/${item.slug}`}
                className="flex gap-2.5 p-1.5 rounded-md hover:bg-paper-soft hover:-translate-y-px transition-all duration-150 group"
              >
                <div
                  className="w-[22px] flex-shrink-0 relative"
                  style={{ aspectRatio: "2 / 3" }}
                  aria-hidden
                >
                  <BookCoverFallback
                    title={item.title}
                    size="sm"
                    className="w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0 leading-snug">
                  <p className="text-xs font-medium text-ink-deep truncate group-hover:text-gold-deep transition-colors">
                    {item.title}
                  </p>
                  {item.author_name && (
                    <p className="text-[10px] italic text-ink-fade truncate">
                      {item.author_name}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </HomeCard>
  );
}
