import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { authorPhotoUrl } from "@/services/images";
import { CountryBadge } from "@/components/ui";
import type { AuthorListItem } from "@/services/authorList";

function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function buildPeriod(birth: number | null, death: number | null): string | null {
  if (birth === null && death === null) return null;
  if (birth !== null && death !== null) return `${birth} — ${death}`;
  if (birth !== null) return `${birth} —`;
  return `— ${death}`;
}

export type AuthorCardProps = {
  author: AuthorListItem;
};

export default function AuthorCard({ author }: AuthorCardProps) {
  const photoSrc = author.photo_url ? authorPhotoUrl(author.photo_url) : null;
  const initials = getInitials(author.name);
  const period = buildPeriod(author.birth_year, author.death_year);

  const stats: string[] = [];
  stats.push(
    `${author.books_count} ${author.books_count === 1 ? "livro" : "livros"}`,
  );
  if (author.finished_count > 0) stats.push(`${author.finished_count} lidos`);
  if (author.quotes_count > 0)
    stats.push(
      `${author.quotes_count} ${author.quotes_count === 1 ? "citação" : "citações"}`,
    );

  return (
    <Link
      href={`/author/${author.slug}`}
      className={clsx(
        "block group rounded-lg p-4",
        "border border-border bg-ivory-light",
        "shadow-[0_1px_2px_rgba(74,56,38,0.05),0_4px_12px_rgba(74,56,38,0.06)]",
        "transition-all duration-150",
        "hover:border-roasted-chestnut hover:-translate-y-0.5",
      )}
    >
      <div className="flex items-start gap-4">
        {/* Foto 64×86 (3:4) */}
        <div
          className="w-16 flex-shrink-0 relative rounded-md overflow-hidden border border-border bg-cappuccino/15"
          style={{ aspectRatio: "3 / 4" }}
        >
          {photoSrc ? (
            <Image
              src={photoSrc}
              alt={`Foto de ${author.name}`}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display text-xl text-cappuccino-soft">
              {initials}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base font-medium text-ink-deep leading-tight line-clamp-2">
            {author.name}
          </h3>
          {(author.country || period) && (
            <p className="mt-1 text-xs text-ink-soft flex flex-wrap items-center gap-1.5">
              {author.country && (
                <CountryBadge country={author.country} showLabel={false} />
              )}
              {period && (
                <span className="italic text-ink-fade">{period}</span>
              )}
            </p>
          )}
          <p className="mt-2 text-xs italic text-ink-fade">
            {stats.join(" · ")}
          </p>
        </div>
      </div>
    </Link>
  );
}
