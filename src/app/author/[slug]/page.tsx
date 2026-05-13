import Link from "next/link";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import {
  Card,
  BackButton,
  CountryBadge,
  Button,
} from "@/components/ui";
import AuthorActions from "@/components/DetailsPage/AuthorActions";
import AuthorQuoteCarousel from "@/components/AuthorQuoteCarousel";
import AuthorBibliographyTimeline from "@/components/AuthorBibliographyTimeline";
import AuthorReadingHistory from "@/components/AuthorReadingHistory";
import { AuthorInteractionProvider } from "@/components/AuthorInteractionContext";
import { authorDetailBySlug } from "@/services/authorDetail";
import { authorPhotoUrl } from "@/services/images";
import { notFound } from "next/navigation";
import {
  PlusIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

function buildPeriod(birth: number | null, death: number | null): string | null {
  if (birth === null && death === null) return null;
  if (birth !== null && death !== null) return `${birth} — ${death}`;
  if (birth !== null) return `${birth} —`;
  return `— ${death}`;
}

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

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await authorDetailBySlug(slug);
  if (!data) notFound();

  const {
    author,
    series,
    categories,
    collections,
    quotes,
    stats,
    bibliography,
    readingHistory,
  } = data;
  const period = buildPeriod(author.birth_year, author.death_year);
  const hasMeta = !!(period || author.country || author.bio);
  const photoSrc = author.photo_url ? authorPhotoUrl(author.photo_url) : null;
  const initials = getInitials(author.name);

  const fromForCreate = `/author/${author.slug}`;

  return (
    <AppShell>
      <div className="mb-4">
        <BackButton fallback="/author" />
      </div>

      {/* HERO — border-bottom gradient gold via pseudo div ::after */}
      <div className="relative grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-6 mb-6 pb-6">
        {/* Foto — fallback com gradient diagonal cappuccino → gold-deep */}
        <div
          className="w-[140px] flex-shrink-0 relative rounded-md overflow-hidden border border-border"
          style={{
            aspectRatio: "3 / 4",
            background: photoSrc
              ? "var(--color-cappuccino)"
              : "linear-gradient(135deg, var(--color-cappuccino) 0%, var(--color-gold-deep) 100%)",
          }}
        >
          {photoSrc ? (
            <Image
              src={photoSrc}
              alt={`Foto de ${author.name}`}
              fill
              className="object-cover"
              sizes="140px"
              priority
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center font-display text-4xl"
              style={{ color: "var(--color-paper-soft)" }}
            >
              {initials}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="font-display text-3xl font-medium text-ink-deep leading-tight">
            {author.name}
          </h1>
          {(author.country || period) && (
            <p className="font-body text-ink-soft mt-2 flex flex-wrap items-center gap-2 text-sm">
              {author.country && <CountryBadge country={author.country} />}
              {period && (
                <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-navy/10 text-navy border border-navy/30">
                  {period}
                </span>
              )}
            </p>
          )}
          {author.bio && (
            <p className="font-body italic text-ink-soft mt-3 max-w-prose leading-relaxed text-[15px] whitespace-pre-wrap">
              {author.bio}
            </p>
          )}
          {!hasMeta && (
            <p className="text-sm italic text-ink-fade mt-2">
              Sem informações adicionais.
            </p>
          )}
        </div>

        <div className="flex items-start sm:justify-end">
          <AuthorActions
            authorId={author.id}
            authorName={author.name}
            authorSlug={author.slug}
          />
        </div>

        {/* Border-bottom gradient — fade transparent → navy → transparent.
            Sessão 17.3: trocado de gold pra navy (autor = entidade
            informacional, navy semântico). */}
        <div
          aria-hidden
          className="absolute left-0 right-0 bottom-0 h-[2px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(30, 58, 95, 0.4) 30%, var(--color-navy) 50%, rgba(30, 58, 95, 0.4) 70%, transparent 100%)",
          }}
        />
      </div>

      {/* TOOLBAR — botões com border colorido por ação */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Link
          href={`/book/new?author_id=${author.id}&from=${encodeURIComponent(fromForCreate)}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-body font-medium transition-colors border bg-ivory-light text-cappuccino border-cappuccino hover:bg-cappuccino hover:text-ivory-light"
        >
          <PlusIcon className="w-4 h-4" />
          Adicionar livro
        </Link>
        <Link
          href={`/quote/new?author_id=${author.id}&from=${encodeURIComponent(fromForCreate)}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-body font-medium transition-colors border bg-ivory-light text-burgundy border-burgundy hover:bg-burgundy hover:text-ivory-light"
        >
          <PlusIcon className="w-4 h-4" />
          Adicionar citação
        </Link>
      </div>

      {/* STATS — 4 cards com ícones coloridos por categoria */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Livros que tenho"
          value={String(stats.books_count)}
          icon={<BookOpenIcon className="w-5 h-5" />}
          iconColor="text-cappuccino"
        />
        <StatCard
          label="Lidos"
          value={String(stats.read_count)}
          icon={<CheckCircleIcon className="w-5 h-5" />}
          iconColor="text-moss"
        />
        <StatCard
          label="Citações"
          value={String(stats.quotes_count)}
          icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
          iconColor="text-burgundy"
        />
        <StatCard
          label="Avaliação média"
          value={
            stats.avg_rating !== null
              ? `${stats.avg_rating.toFixed(1)} ★`
              : "—"
          }
          icon={<StarIcon className="w-5 h-5" />}
          iconColor="text-gold-deep"
        />
      </div>

      {/* CARROSSEL DE CITAÇÕES MARCANTES */}
      {quotes.length > 0 && <AuthorQuoteCarousel quotes={quotes} />}

      {/* BIBLIOGRAFIA + HISTÓRICO — provider compartilha hoveredBookId entre
          os dois pra hover na lista destacar o card na timeline. */}
      <AuthorInteractionProvider>
        <AuthorBibliographyTimeline
          entries={bibliography}
          authorId={author.id}
        />
        {readingHistory.length > 0 && (
          <AuthorReadingHistory entries={readingHistory} />
        )}
      </AuthorInteractionProvider>

      {/* SÉRIES */}
      {series.length > 0 && (
        <section className="my-10">
          <h2 className="font-display text-xl font-medium text-ink-deep mb-4 pb-2 border-b border-border">
            Séries deste autor
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {series.map((s) => (
              <Link
                key={s.id}
                href={`/serie/${s.slug}`}
                className="block p-4 rounded-md border border-border bg-ivory-light hover:border-gold transition-colors"
              >
                <p className="font-display text-base text-ink-deep">{s.name}</p>
                {s.qty_volumes !== null && (
                  <p className="text-xs italic text-ink-fade mt-1">
                    {s.qty_volumes}{" "}
                    {s.qty_volumes === 1 ? "volume" : "volumes"}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* COLEÇÕES — agrupamentos do tipo "Agatha Christie" com sub-divisões
          via `section` em cada item. Cada section vira um card (no estilo
          de série), agrupado pela coleção pai. Quando a coleção não usa
          sections, mostra só um card com o nome da coleção. */}
      {collections.length > 0 && (
        <section className="my-10">
          <h2 className="font-display text-xl font-medium text-ink-deep mb-4 pb-2 border-b border-border">
            Coleções deste autor
          </h2>
          <div className="space-y-6">
            {collections.map((coll) => {
              const hasNamedSections = coll.sections.some(
                (s) => s.name !== null,
              );
              return (
                <div key={coll.id} className="space-y-3">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <Link
                      href={`/collection/${coll.slug}`}
                      className="font-display text-base font-medium text-ink-deep hover:text-gold-deep transition-colors"
                    >
                      {coll.name}
                    </Link>
                    <span className="text-xs italic text-ink-fade">
                      {coll.book_count}{" "}
                      {coll.book_count === 1 ? "livro" : "livros"}
                    </span>
                  </div>
                  {hasNamedSections && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {coll.sections
                        .filter((s) => s.name !== null)
                        .map((s) => (
                          <Link
                            key={`${coll.id}-${s.name}`}
                            href={`/collection/${coll.slug}#${encodeURIComponent(
                              s.name ?? "",
                            )}`}
                            className="block p-4 rounded-md border border-border bg-ivory-light hover:border-gold transition-colors"
                          >
                            <p className="font-display text-base text-ink-deep">
                              {s.name}
                            </p>
                            <p className="text-xs italic text-ink-fade mt-1">
                              {s.book_count}{" "}
                              {s.book_count === 1 ? "livro" : "livros"}
                            </p>
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CATEGORIAS (gêneros) — info auxiliar sobre o que o autor escreve. */}
      {categories.length > 0 && (
        <section className="my-10">
          <h2 className="font-display text-xl font-medium text-ink-deep mb-4 pb-2 border-b border-border">
            Gêneros que este autor escreve
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-ivory-light text-sm text-ink-deep hover:border-gold transition-colors"
              >
                <span>{c.name}</span>
                <span className="text-xs italic text-ink-fade">
                  · {c.book_count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {bibliography.length === 0 &&
        series.length === 0 &&
        categories.length === 0 &&
        collections.length === 0 &&
        quotes.length === 0 &&
        readingHistory.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-ink-soft italic">
              Nada cadastrado pra esse autor ainda. Use os atalhos acima pra
              começar a montar a bibliografia.
            </p>
          </Card>
        )}
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconColor: string;
}) {
  return (
    <Card size="sm">
      <div className={`flex items-center justify-center mb-2 ${iconColor}`}>
        {icon}
      </div>
      <p className="text-[11px] uppercase tracking-wider text-ink-fade text-center">
        {label}
      </p>
      <p className="font-display text-2xl text-ink-deep mt-1 text-center">
        {value}
      </p>
    </Card>
  );
}
