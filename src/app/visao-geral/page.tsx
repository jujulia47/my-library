import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/utils/supabase/server";
import { getShelfOverview } from "@/services/overviewData";
import { formatBRL } from "@/utils/formatCurrency";
import { formatReadingTime, SECONDS_PER_PAGE } from "@/utils/readingPlan";
import { getUserSecondsPerPage } from "@/services/readingPace";
import { SectionLabel } from "@/components/Home/SectionLabel";
import { WorldMapChart } from "@/components/Overview/WorldMapChart";
import { LanguageBars } from "@/components/Overview/LanguageBars";
import { PagesHistogram } from "@/components/Overview/PagesHistogram";
import { BarList } from "@/components/Overview/BarList";

export const metadata: Metadata = {
  title: "Visão geral · My Library",
};

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("pt-BR");

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-paper border border-paper-soft rounded-lg p-4">
      <p className="text-[11px] uppercase tracking-wider text-ink-fade">
        {label}
      </p>
      <p className="font-display text-2xl text-ink-deep mt-1 leading-none">
        {value}
      </p>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2.5 rounded-full bg-paper-soft overflow-hidden">
      <div
        className="h-full rounded-full bg-cappuccino"
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5 border-b border-border/40 last:border-b-0">
      <span className="text-xs text-ink-soft">{label}</span>
      <span className="text-sm text-ink-deep font-medium text-right">
        {value}
      </span>
    </div>
  );
}

export default async function VisaoGeralPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getShelfOverview(user.id);
  const r = data.reading;

  // Ritmo real da usuária (ou fixo) pra estimar o tempo da estante não lida.
  const secondsPerPage = await getUserSecondsPerPage(user.id);
  const paceM = Math.floor(secondsPerPage / 60);
  const paceS = Math.round(secondsPerPage % 60);
  const paceLabel =
    paceM > 0
      ? `${paceM}min${paceS ? (paceS < 10 ? "0" : "") + paceS : ""}/pág`
      : `${paceS}s/pág`;

  const pagesPercent =
    data.total_pages_all > 0
      ? Math.round((data.total_pages_read / data.total_pages_all) * 100)
      : 0;

  // Publicação em dois gráficos: décadas até os anos 90 / 2000 em diante
  // ano a ano.
  const oldDecades = data.decades.filter(
    (d) => d.label === "<1800" || Number(d.label) < 2000,
  );

  return (
    <AppShell>
      <header className="pb-4 border-b border-border">
        <p className="font-body text-xs uppercase tracking-[0.25em] text-ink-fade">
          Minha biblioteca
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-ink-deep mt-1 leading-tight">
          Visão geral da estante
        </h1>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mt-6">
        <StatCard
          label="Livros cadastrados"
          value={String(data.total_books)}
        />
        <StatCard label="Na estante" value={String(data.on_shelf)} />
        <StatCard
          label="Vendidos / trocados"
          value={String(data.sold_or_traded)}
        />
        <StatCard label="Livros lidos" value={String(r.read_books_total)} />
        <StatCard label="Países lidos" value={String(r.countries.length)} />
        <StatCard label="Idiomas lidos" value={String(r.languages.length)} />
      </div>

      {/* ------------------------------------------------ Progresso */}
      <SectionLabel>Progresso da estante</SectionLabel>
      <div className="bg-paper border border-paper-soft rounded-lg p-4 md:p-5 space-y-4">
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-sm text-ink-soft">
              <span className="font-medium text-ink-deep">
                {r.read_books_total}
              </span>{" "}
              de {data.total_books} livros lidos
            </span>
            <span className="text-sm font-medium text-[#6D3914] tabular-nums">
              {data.read_percent}%
            </span>
          </div>
          <ProgressBar percent={data.read_percent} />
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-sm text-ink-soft">
              <span className="font-medium text-ink-deep">
                {fmt(data.total_pages_read)}
              </span>{" "}
              de {fmt(data.total_pages_all)} páginas lidas
            </span>
            <span className="text-sm font-medium text-[#6D3914] tabular-nums">
              {pagesPercent}%
            </span>
          </div>
          <ProgressBar percent={pagesPercent} />
        </div>
        {data.unread_shelf_pages > 0 && (
          <p className="text-xs text-ink-fade italic">
            Pela frente: {fmt(data.unread_shelf_pages)} páginas ainda não lidas
            na estante — ~
            {formatReadingTime(data.unread_shelf_pages * secondsPerPage)} de
            leitura (
            {secondsPerPage === SECONDS_PER_PAGE ? "estimativa" : "no seu ritmo"}{" "}
            · ~{paceLabel}).
          </p>
        )}
      </div>

      {/* ------------------------------------------------ Mapa */}
      <SectionLabel>Volta ao mundo · países dos autores lidos</SectionLabel>
      <div className="bg-paper border border-paper-soft rounded-lg p-4">
        <WorldMapChart data={r.countries} withoutCountry={r.without_country} />
      </div>

      {/* ------------------------------------------------ Perfil de leitura */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 items-stretch">
        <div className="flex flex-col">
          <SectionLabel>Livros lidos por idioma</SectionLabel>
          <div className="bg-paper border border-paper-soft rounded-lg p-4 flex-1">
            <LanguageBars data={r.languages} />
          </div>
        </div>
        <div className="flex flex-col">
          <SectionLabel>Perfil de leitura</SectionLabel>
          <div className="bg-paper border border-paper-soft rounded-lg p-4 flex-1">
            <MiniStat
              label="Autores distintos lidos"
              value={String(r.authors_read_total)}
            />
            {r.top_author && (
              <MiniStat
                label="Autor mais lido"
                value={`${r.top_author.name} · ${r.top_author.count} ${
                  r.top_author.count === 1 ? "livro" : "livros"
                }`}
              />
            )}
            <MiniStat label="Livros relidos" value={String(r.reread_books)} />
            <MiniStat label="Livros favoritos ♥" value={String(data.favorites)} />
            {r.avg_rating !== null && (
              <MiniStat
                label="Nota média"
                value={`${r.avg_rating.toLocaleString("pt-BR")} ★`}
              />
            )}
            {r.rated_count > 0 && (
              <MiniStat
                label="Leituras 5 estrelas"
                value={`${r.five_star_count} de ${r.rated_count} (${Math.round(
                  (r.five_star_count / r.rated_count) * 100,
                )}%)`}
              />
            )}
            {r.record_books_year && (
              <MiniStat
                label="Ano recorde em livros"
                value={`${r.record_books_year.year} · ${r.record_books_year.books} livros`}
              />
            )}
            {r.record_pages_year && (
              <MiniStat
                label="Ano recorde em páginas"
                value={`${r.record_pages_year.year} · ${fmt(
                  r.record_pages_year.pages,
                )} páginas`}
              />
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ Histogramas */}
      <SectionLabel>Tamanho dos livros da estante</SectionLabel>
      <div className="bg-paper border border-paper-soft rounded-lg p-4 md:p-6">
        <PagesHistogram
          data={data.shelf_page_buckets}
          heightClass="h-56 md:h-72"
          footnote={
            data.shelf_without_pages > 0
              ? `${data.shelf_without_pages} ${
                  data.shelf_without_pages === 1
                    ? "livro sem nº de páginas"
                    : "livros sem nº de páginas"
                }`
              : null
          }
        />
      </div>

      {oldDecades.length > 0 && (
        <>
          <SectionLabel>Década de publicação · até os anos 90</SectionLabel>
          <div className="bg-paper border border-paper-soft rounded-lg p-4 md:p-6">
            <PagesHistogram
              data={oldDecades}
              heightClass="h-40 md:h-56"
              dense
              footnote={
                data.oldest_year !== null
                  ? `Livro mais antigo da estante: ${data.oldest_year}`
                  : null
              }
            />
          </div>
        </>
      )}

      {data.recent_years.length > 0 && (
        <>
          <SectionLabel>Ano de publicação · 2000 em diante</SectionLabel>
          <div className="bg-paper border border-paper-soft rounded-lg p-4 md:p-6">
            <PagesHistogram
              data={data.recent_years}
              heightClass="h-40 md:h-56"
              dense
            />
          </div>
        </>
      )}

      {/* ------------------------------------------------ Acervo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 items-stretch">
        <div className="flex flex-col">
          <SectionLabel>Top editoras</SectionLabel>
          <div className="bg-paper border border-paper-soft rounded-lg p-4 flex-1">
            <BarList
              data={data.publishers}
              emptyMessage="Nenhuma editora cadastrada ainda."
            />
          </div>
        </div>
        <div className="flex flex-col">
          <SectionLabel>Origem dos livros</SectionLabel>
          <div className="bg-paper border border-paper-soft rounded-lg p-4 flex-1">
            <BarList data={data.origins} />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ Investimento */}
      <SectionLabel>Investimento</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard
          label="Total investido"
          value={formatBRL(data.purchase_total)}
        />
        <StatCard
          label="Preço médio por livro"
          value={
            data.purchase_avg !== null ? formatBRL(data.purchase_avg) : "—"
          }
        />
        <StatCard
          label="Livros com preço"
          value={`${data.purchase_count} de ${data.total_books}`}
        />
      </div>
    </AppShell>
  );
}
