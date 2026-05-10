import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { BookCoverFallback } from "@/components/ui";
import { HomeCard, HomeCardEmpty } from "./HomeCard";
import type { NextReadItem, NextReadOrigin } from "@/services/homeData";

// Sessão 17.3: cores semânticas das próximas leituras alinhadas ao doc:
//   high → burgundy (paixão), medium → gold (foco), série → navy (saga).
const ORIGIN_TEXT_CLASS: Record<NextReadOrigin, string> = {
  priority_high: "text-burgundy",
  priority_medium: "text-gold-deep",
  series_next: "text-navy",
};

// Cor do border-l-3 de cada item — mesma semântica acima.
const ORIGIN_BORDER_CLASS: Record<NextReadOrigin, string> = {
  priority_high: "border-l-burgundy",
  priority_medium: "border-l-gold",
  series_next: "border-l-navy",
};

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
        <ul className="space-y-1">
          {data.map((item) => (
            <li key={item.id}>
              <Link
                href={`/book/${item.slug}`}
                className={`flex gap-2.5 p-1.5 rounded-md border-l-[3px] hover:bg-paper-soft hover:-translate-y-px transition-all duration-150 group ${
                  ORIGIN_BORDER_CLASS[item.origin]
                }`}
              >
                <div
                  className="w-[22px] flex-shrink-0 relative"
                  style={{ aspectRatio: "2 / 3" }}
                  aria-hidden
                >
                  {item.cover_url ? (
                    <Image
                      src={item.cover_url}
                      alt=""
                      fill
                      className="object-cover rounded-sm border border-ink-deep/20"
                      sizes="22px"
                    />
                  ) : (
                    <BookCoverFallback
                      title={item.title}
                      size="sm"
                      className="w-full h-full"
                    />
                  )}
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
                  <p
                    className={`text-[10px] truncate ${ORIGIN_TEXT_CLASS[item.origin]}`}
                  >
                    {item.origin_label}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </HomeCard>
  );
}
