import type { PageBucket } from "@/services/overviewData";

type Props = {
  data: PageBucket[];
  /** Nota de rodapé (ex.: livros sem nº de páginas). */
  footnote?: string | null;
  /** Altura das colunas (default compacto pra cards da home). */
  heightClass?: string;
  /**
   * Muitas barras (ex.: décadas): colunas mais finas, gap menor e labels em
   * pé no mobile pra não colidirem.
   */
  dense?: boolean;
};

/** Histograma vertical: quantidade de livros por faixa/categoria. */
export function PagesHistogram({
  data,
  footnote,
  heightClass = "h-32",
  dense = false,
}: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm italic text-ink-fade py-4">
        Nenhum livro com nº de páginas cadastrado.
      </p>
    );
  }
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div>
      <div
        className={`grid items-end ${dense ? "gap-0.5 md:gap-1" : "gap-1.5"} ${heightClass}`}
        style={{
          gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
        }}
      >
        {data.map((b) => (
          <div
            key={b.label}
            className="flex flex-col items-center justify-end h-full min-w-0"
            title={`${b.label}: ${b.count} ${b.count === 1 ? "livro" : "livros"}`}
          >
            <span
              className={`${dense ? "text-[9px]" : "text-[10px]"} text-ink-fade tabular-nums leading-none mb-0.5`}
            >
              {b.count > 0 ? b.count : ""}
            </span>
            <div
              className="w-full rounded-t bg-cappuccino"
              style={{
                height: `${Math.max((b.count / max) * 100, b.count > 0 ? 4 : 0)}%`,
                opacity: b.count > 0 ? 1 : 0.25,
                minHeight: b.count > 0 ? 4 : 2,
              }}
            />
          </div>
        ))}
      </div>
      <div
        className={`grid ${dense ? "gap-0.5 md:gap-1" : "gap-1.5"} mt-1 border-t border-border/60 pt-1`}
        style={{
          gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
        }}
      >
        {data.map((b) => (
          <span
            key={b.label}
            className={
              dense
                ? "text-[9px] md:text-[10px] text-ink-fade justify-self-center [writing-mode:vertical-rl] md:[writing-mode:horizontal-tb]"
                : "text-[10px] text-ink-fade text-center truncate"
            }
            title={b.label}
          >
            {b.label}
          </span>
        ))}
      </div>
      {footnote && (
        <p className="mt-2 text-[11px] italic text-ink-fade">{footnote}</p>
      )}
    </div>
  );
}
