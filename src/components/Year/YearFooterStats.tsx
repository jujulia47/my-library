import {
  PauseIcon,
  XCircleIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import type { YearData } from "@/services/yearData";

type Props = {
  stats: YearData["footer_stats"];
};

/**
 * Sessão 17.10: cada stat ganha border-l-2 colorida + padding pra parecer
 * coluna de informação (não mais flex-row solta). Cores semânticas:
 *   - Pausados → cappuccino (calmo, em standby)
 *   - Abandonados → ink-fade (apagado, descartado)
 *   - Autores novos → navy (descoberta, frescor)
 */
export function YearFooterStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 pt-6 border-t border-paper-soft">
      <FooterStat
        icon={<PauseIcon className="w-4 h-4" />}
        accentClass="border-l-cappuccino text-cappuccino"
        value={stats.paused_count}
        label={stats.paused_count === 1 ? "pausada" : "pausadas"}
      />
      <FooterStat
        icon={<XCircleIcon className="w-4 h-4" />}
        accentClass="border-l-ink-fade text-ink-fade"
        value={stats.abandoned_count}
        label={stats.abandoned_count === 1 ? "abandonada" : "abandonadas"}
      />
      <FooterStat
        icon={<UserPlusIcon className="w-4 h-4" />}
        accentClass="border-l-navy text-navy"
        value={stats.new_authors_count}
        label={
          stats.new_authors_count === 1 ? "autor novo" : "autores novos"
        }
      />
    </div>
  );
}

function FooterStat({
  icon,
  accentClass,
  value,
  label,
}: {
  icon: React.ReactNode;
  accentClass: string;
  value: number;
  label: string;
}) {
  // Border-l vem da `accentClass`; o `text-*` da mesma classe colore o ícone
  // através de `currentColor` (mais simples que prop separada).
  return (
    <div
      className={`flex items-center gap-2 py-2 pl-3 border-l-2 ${accentClass}`}
    >
      <span aria-hidden className="flex-shrink-0">
        {icon}
      </span>
      <span className="font-display text-2xl text-ink-deep tabular-nums leading-none">
        {value}
      </span>
      <span className="text-xs italic text-ink-fade">{label}</span>
    </div>
  );
}
