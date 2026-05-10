import AppShell from "@/components/AppShell";
import { BookmarkIcon, FireIcon } from "@heroicons/react/24/solid";
import { getHomeData } from "@/services/homeData";
import { HomeHeader } from "@/components/Home/HomeHeader";
import { ReadingNow } from "@/components/Home/ReadingNow";
import { StatsStrip } from "@/components/Home/StatsStrip";
import { ChallengeArc } from "@/components/Home/ChallengeArc";
import { BooksPerMonthChart } from "@/components/Home/BooksPerMonthChart";
import { ReadingHeatmap } from "@/components/Home/ReadingHeatmap";
import { FormatDonut } from "@/components/Home/FormatDonut";
import { GenrePie } from "@/components/Home/GenrePie";
import { ReadingPaceSparkline } from "@/components/Home/ReadingPaceSparkline";
import { TopAuthors } from "@/components/Home/TopAuthors";
import { RatingDistribution } from "@/components/Home/RatingDistribution";
import { NextReads } from "@/components/Home/NextReads";
import { FavoriteCollections } from "@/components/Home/FavoriteCollections";
import { DailyQuote } from "@/components/Home/DailyQuote";
import { RecentlyFinished } from "@/components/Home/RecentlyFinished";
import { HomeFooter } from "@/components/Home/HomeFooter";
import { SectionLabel } from "@/components/Home/SectionLabel";

// Sessão 17.7: força SSR fresco a cada request. Sem isso, edits no
// `profiles.display_name` via SQL não refletiam no header até hard reload com
// cache invalidado. Como a home roda queries autenticadas e estatísticas
// agregadas, fluxo já é dinâmico — esse hint só desativa o cache de fetch
// que o Next 15 aplicaria a chamadas server-side derivadas.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getHomeData();
  const currentMonth = new Date(`${data.today}T00:00:00`).getMonth() + 1;

  return (
    <AppShell>
      <section className="home-section">
        <HomeHeader
          currentYear={data.current_year}
          today={data.today}
          lastActivity={data.last_activity}
        />
      </section>

      <section className="home-section">
        <SectionLabel
          icon={<BookmarkIcon className="w-3.5 h-3.5" />}
          iconColor="#EF9F27"
        >
          Lendo agora ·{" "}
          {data.reading_now.length === 0
            ? "nenhum livro"
            : `${data.reading_now.length} ${
                data.reading_now.length === 1 ? "livro" : "livros"
              }`}
        </SectionLabel>
        <ReadingNow items={data.reading_now} />
      </section>

      <section className="home-section">
        <SectionLabel>Resumo de {data.current_year}</SectionLabel>
        <StatsStrip stats={data.stats} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          {data.active_challenge && (
            <ChallengeArc
              challenge={data.active_challenge}
              currentYear={data.current_year}
            />
          )}
          <div
            className={
              data.active_challenge ? "md:col-span-2" : "md:col-span-3"
            }
          >
            <BooksPerMonthChart
              data={data.books_per_month_chart}
              currentMonth={currentMonth}
            />
          </div>
        </div>
      </section>

      <section className="home-section">
        <SectionLabel
          icon={<FireIcon className="w-3.5 h-3.5" />}
          iconColor="#EF9F27"
        >
          Heatmap · páginas por dia em {data.current_year}
        </SectionLabel>
        <div className="bg-paper border border-paper-soft rounded-lg p-4 mb-6">
          <ReadingHeatmap data={data.heatmap} year={data.current_year} />
        </div>
      </section>

      <section className="home-section">
        <SectionLabel>Padrões de leitura</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <FormatDonut data={data.format_distribution} />
          <GenrePie data={data.genre_distribution} />
          <ReadingPaceSparkline data={data.pace_sparkline} />
        </div>
      </section>

      <section className="home-section">
        <SectionLabel>Acervo</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <TopAuthors data={data.top_authors} />
          <RatingDistribution data={data.rating_distribution} />
        </div>
      </section>

      <section className="home-section">
        <SectionLabel>Próximos passos</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <NextReads data={data.next_reads} />
          <FavoriteCollections data={data.favorite_collections} />
        </div>
      </section>

      <section className="home-section">
        <SectionLabel>Memória recente</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
          {data.random_quotes.length > 0 && (
            <div className="md:col-span-2">
              <DailyQuote quotes={data.random_quotes} />
            </div>
          )}
          <div
            className={
              data.random_quotes.length > 0
                ? "md:col-span-3"
                : "md:col-span-5"
            }
          >
            <RecentlyFinished data={data.recently_finished} />
          </div>
        </div>
      </section>

      <HomeFooter />
    </AppShell>
  );
}
