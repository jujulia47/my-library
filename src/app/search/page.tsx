import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import AppShell from "@/components/AppShell";
import { PageHeader, BookCoverFallback } from "@/components/ui";
import {
  globalSearch,
  hrefForResult,
  type SearchCategory,
  type SearchResultGroup,
  type SearchResultItem,
} from "@/services/globalSearch";

const ALL_CATEGORIES: SearchCategory[] = [
  "book",
  "serie",
  "author",
  "quote",
  "wishlist",
  "collection",
];

const CATEGORY_LABEL: Record<SearchCategory | "all", string> = {
  all: "Tudo",
  book: "Livros",
  serie: "Séries",
  author: "Autores",
  quote: "Citações",
  wishlist: "Wishlist",
  collection: "Coleções",
};

function pickFirst(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = (pickFirst(sp.q) ?? "").trim();
  const catRaw = pickFirst(sp.cat);
  const activeCat: SearchCategory | "all" = ALL_CATEGORIES.includes(
    catRaw as SearchCategory,
  )
    ? (catRaw as SearchCategory)
    : "all";

  const result =
    q.length >= 2
      ? await globalSearch(q, 20)
      : { groups: [], total: 0 };

  const filteredGroups =
    activeCat === "all"
      ? result.groups
      : result.groups.filter((g) => g.category === activeCat);

  return (
    <AppShell>
      <PageHeader
        title={q ? `Resultados para "${q}"` : "Busca"}
        subtitle={
          q.length < 2
            ? "Digite pelo menos 2 caracteres."
            : `${result.total} ${result.total === 1 ? "resultado" : "resultados"}`
        }
      />

      {/* Input nativo de busca — server-rendered, sem JS. Garante que no
          mobile (onde o TopBar com busca global é escondido) sempre exista
          um campo pra digitar. Submete via GET pra essa mesma página. */}
      <form action="/search" method="get" className="mb-6">
        {activeCat !== "all" && (
          <input type="hidden" name="cat" value={activeCat} />
        )}
        <label htmlFor="search-q" className="sr-only">
          Buscar
        </label>
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-fade"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </span>
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={q}
            autoFocus={!q}
            placeholder="Buscar livros, séries, autores, citações…"
            className="w-full rounded-md bg-ivory-light text-ink-deep placeholder:text-ink-fade border border-ink-fade/40 focus:border-gold focus:ring-2 focus:ring-gold/20 pl-10 pr-3 py-2.5 text-base sm:text-sm font-body outline-none transition-colors"
          />
        </div>
      </form>

      {q.length >= 2 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <FilterChip
            href={`/search?q=${encodeURIComponent(q)}`}
            label="Tudo"
            count={result.total}
            active={activeCat === "all"}
          />
          {ALL_CATEGORIES.map((cat) => {
            const g = result.groups.find((gg) => gg.category === cat);
            const count = g?.total ?? 0;
            if (count === 0) return null;
            return (
              <FilterChip
                key={cat}
                href={`/search?q=${encodeURIComponent(q)}&cat=${cat}`}
                label={CATEGORY_LABEL[cat]}
                count={count}
                active={activeCat === cat}
              />
            );
          })}
        </div>
      )}

      {q.length >= 2 && filteredGroups.length === 0 && (
        <p className="text-ink-soft italic text-center py-12">
          Nenhum resultado para «{q}»
          {activeCat !== "all" && ` na categoria ${CATEGORY_LABEL[activeCat]}`}.
        </p>
      )}

      <div className="space-y-10">
        {filteredGroups.map((g) => (
          <CategorySection key={g.category} group={g} />
        ))}
      </div>
    </AppShell>
  );
}

function FilterChip({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-body transition-colors",
        active
          ? "bg-ink-deep text-ivory-light border-ink-deep"
          : "bg-ivory-light border-border text-ink-soft hover:bg-paper-soft hover:text-ink-deep",
      )}
    >
      {label}
      <span
        className={clsx(
          "text-xs",
          active ? "text-ivory-light/70" : "text-ink-fade",
        )}
      >
        {count}
      </span>
    </Link>
  );
}

function CategorySection({ group }: { group: SearchResultGroup }) {
  return (
    <section>
      <header className="flex items-baseline justify-between mb-4 pb-2 border-b border-border">
        <h2 className="font-display text-xl font-medium text-ink-deep">
          {group.label}
        </h2>
        <span className="text-sm italic text-ink-fade">
          {group.items.length} de {group.total}
        </span>
      </header>
      <ul className="space-y-2">
        {group.items.map((item) => (
          <ResultRow
            key={`${group.category}-${item.id}`}
            item={item}
            category={group.category}
          />
        ))}
      </ul>
    </section>
  );
}

function ResultRow({
  item,
  category,
}: {
  item: SearchResultItem;
  category: SearchCategory;
}) {
  const href = hrefForResult(category, item.slug, item.id);
  return (
    <li>
      <Link
        href={href}
        className="flex items-start gap-4 p-3 rounded-md border border-transparent hover:border-roasted-chestnut hover:bg-paper/40 transition-colors"
      >
        <Thumb item={item} category={category} />
        <div className="flex-1 min-w-0">
          <p className="font-display text-base text-ink-deep leading-tight line-clamp-1">
            {item.title}
          </p>
          {item.subtitle && (
            <p className="text-sm italic text-ink-fade mt-0.5 truncate">
              {item.subtitle}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}

function Thumb({
  item,
  category,
}: {
  item: SearchResultItem;
  category: SearchCategory;
}) {
  if (category === "book" && item.cover_url) {
    return (
      <div
        className="w-12 flex-shrink-0 relative rounded-sm overflow-hidden border border-ink-deep/15"
        style={{ aspectRatio: "2 / 3" }}
      >
        <Image
          src={item.cover_url}
          alt=""
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>
    );
  }
  if (category === "book" || category === "wishlist") {
    return (
      <div
        className={clsx(
          "w-12 flex-shrink-0 relative rounded-sm overflow-hidden border",
          category === "wishlist"
            ? "border-terracota/35 bg-terracota/[0.10]"
            : "border-ink-deep/15",
        )}
        style={{ aspectRatio: "2 / 3" }}
      >
        <BookCoverFallback
          title={item.title}
          size="md"
          className="w-full h-full"
        />
      </div>
    );
  }
  const colorByCategory: Record<string, string> = {
    serie: "bg-moss/20 text-moss",
    author: "bg-cappuccino/20 text-cappuccino",
    quote: "bg-gold/20 text-gold-deep",
    collection: "bg-navy/20 text-navy",
  };
  const cls = colorByCategory[category] ?? "bg-ink-fade/20 text-ink-soft";
  const initial = item.title.replace(/^[“"']/, "")[0]?.toUpperCase() ?? "?";
  return (
    <div
      className={clsx(
        "w-12 h-12 flex-shrink-0 rounded-md flex items-center justify-center font-display text-lg font-medium",
        cls,
      )}
    >
      {initial}
    </div>
  );
}
