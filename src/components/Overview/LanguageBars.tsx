import { LANGUAGE_LABELS } from "@/utils/languageLabels";
import type { LanguageCount } from "@/services/overviewData";

type Props = {
  data: LanguageCount[];
};

/** Barras horizontais: livros lidos por idioma (com % sobre o total). */
export function LanguageBars({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm italic text-ink-fade py-4">
        Nenhum livro lido ainda.
      </p>
    );
  }
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-1.5">
      {data.map((d) => {
        const label = d.language
          ? LANGUAGE_LABELS[d.language]
          : "Não informado";
        return (
          <div
            key={d.language ?? "null"}
            className="grid grid-cols-[7rem_1fr_4.5rem] items-center gap-2"
          >
            <span className="text-xs text-ink-soft truncate" title={label}>
              {label}
            </span>
            <span
              className="h-2 rounded-full bg-paper-soft overflow-hidden"
              aria-hidden
            >
              <span
                className="block h-full rounded-full bg-cappuccino"
                style={{ width: `${(d.count / max) * 100}%` }}
              />
            </span>
            <span className="text-xs text-ink-fade tabular-nums text-right">
              {d.count} · {d.percent}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
