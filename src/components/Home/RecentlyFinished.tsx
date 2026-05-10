import Link from "next/link";
import Image from "next/image";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { BookCoverFallback } from "@/components/ui";
import { HomeCard, HomeCardEmpty } from "./HomeCard";
import { formatDate } from "@/utils/formatDate";
import type { RecentlyFinishedBook } from "@/services/homeData";

type Props = {
  data: RecentlyFinishedBook[];
};

export function RecentlyFinished({ data }: Props) {
  return (
    <HomeCard
      title="Concluídos recentemente"
      icon={<CheckCircleIcon className="w-3.5 h-3.5" />}
    >
      {data.length === 0 ? (
        <HomeCardEmpty>
          Nenhum livro concluído ainda este ano.
        </HomeCardEmpty>
      ) : (
        <div className="grid grid-cols-6 gap-2">
          {data.map((book) => {
            const tooltipParts = [book.title];
            if (book.author_name) tooltipParts.push(book.author_name);
            const formatted = formatDate(book.finish_date);
            if (formatted) tooltipParts.push(`concluído em ${formatted}`);
            const tooltip = tooltipParts.join(" · ");

            return (
              <Link
                key={book.id}
                href={`/book/${book.slug}`}
                title={tooltip}
                className="block group hover:-translate-y-1 transition-all"
              >
                <div
                  className="relative w-full group-hover:shadow-[0_4px_12px_rgba(74,56,38,0.15)] rounded overflow-hidden transition-shadow"
                  style={{ aspectRatio: "2 / 3" }}
                >
                  {book.cover_url ? (
                    <Image
                      src={book.cover_url}
                      alt={`Capa de ${book.title}`}
                      fill
                      className="object-cover rounded-sm border border-ink-deep/20"
                      sizes="(max-width: 768px) 12vw, 60px"
                    />
                  ) : (
                    <BookCoverFallback
                      title={book.title}
                      size="sm"
                      className="w-full h-full"
                    />
                  )}
                </div>
                <p
                  className="mt-1.5 text-[10px] leading-tight text-center text-ink-soft group-hover:text-gold-deep transition-colors line-clamp-2 font-body"
                  title={book.title}
                >
                  {book.title}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </HomeCard>
  );
}
