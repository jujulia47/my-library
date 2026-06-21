import Link from "next/link";
import clsx from "clsx";

type Props = {
  year: number;
  availableYears: number[];
  totalBooks: number;
  totalPages: number;
};

export function YearHeader({
  year,
  availableYears,
  totalBooks,
  totalPages,
}: Props) {
  const formattedPages = totalPages.toLocaleString("pt-BR");
  const subtitle =
    totalBooks > 0
      ? `${totalBooks} ${totalBooks === 1 ? "livro" : "livros"} · ${formattedPages} ${
          totalPages === 1 ? "página" : "páginas"
        }`
      : "Sem leituras concluídas";

  return (
    <header
      className="pt-8 pb-6 mb-6 border-b"
      style={{
        borderImage:
          "linear-gradient(90deg, transparent 0%, rgba(240,192,64,0.45) 50%, transparent 100%) 1",
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
      }}
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="min-w-0">
          {/* Sessão 17.3: ano em gold-deep — destaque editorial pra resumo
              do ano. Texto secundário em italic ink-fade (mantém). */}
          <h1 className="font-display text-[28px] font-medium text-gold-deep leading-none">
            Resumo de {year}
          </h1>
          <p className="font-body italic text-ink-fade mt-1 text-sm">
            {subtitle}
          </p>
        </div>

        {availableYears.length > 0 && (
          <nav
            aria-label="Outros anos"
            className="flex flex-wrap gap-1.5 md:justify-end"
          >
            {availableYears.map((y) => {
              const active = y === year;
              return (
                <Link
                  key={y}
                  href={`/year/${y}`}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "text-xs px-2.5 py-1 rounded-md border transition-colors",
                    active
                      ? // Ano selecionado: wash gold pra "estou aqui".
                        "bg-gold/20 text-gold-deep border-gold/40 cursor-default pointer-events-none"
                      : "bg-paper-soft text-ink-soft border-border hover:border-roasted-chestnut hover:text-ink-deep",
                  )}
                >
                  {y}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
