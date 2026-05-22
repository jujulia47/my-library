import Badge, { type BadgeSize, type BadgeVariant } from "./Badge";
import type { Database } from "@/utils/typings/supabase";

type ReadingStatus = Database["public"]["Enums"]["reading_status"];
type OwnershipStatus = Database["public"]["Enums"]["ownership_status"];
type SerieStatus = Database["public"]["Enums"]["serie_status"];

// "tbr" e "wont_read" não estão no enum reading_status — são pseudo-status
// usados pela UI quando o livro existe mas não tem registro em `reading`:
//   - tbr        → vai ler (default)
//   - wont_read  → não vai ler (flag `book.wont_read`)
export type LegacyReadingStatus = ReadingStatus | "tbr" | "wont_read";

const readingMap: Record<LegacyReadingStatus, { variant: BadgeVariant; label: string }> = {
  reading: { variant: "gold", label: "Lendo" },
  paused: { variant: "olive", label: "Pausado" },
  finished: { variant: "moss", label: "Lido" },
  abandoned: { variant: "burgundy", label: "Abandonado" },
  tbr: { variant: "fade", label: "Quero ler" },
  wont_read: { variant: "cappuccino", label: "Não vou ler" },
};

const ownershipMap: Record<OwnershipStatus, { variant: BadgeVariant; label: string }> = {
  // 8 estados físicos granulares + 2 plataformas digitais (Kindle/Audible
  // adicionadas pra livros sem formato físico).
  owned: { variant: "moss", label: "Em casa" },
  lent_out: { variant: "olive", label: "Emprestei" },
  borrowed: { variant: "navy", label: "Tenho emprestado" },
  returned: { variant: "fade", label: "Devolvi" },
  donated: { variant: "fade", label: "Doei" },
  sold: { variant: "fade", label: "Vendi" },
  traded: { variant: "fade", label: "Troquei" },
  lost: { variant: "burgundy", label: "Perdi" },
  kindle: { variant: "navy", label: "Kindle" },
  audible: { variant: "burgundy", label: "Audible" },
};

const serieMap: Record<SerieStatus, { variant: BadgeVariant; label: string }> = {
  tbr: { variant: "fade", label: "Quero ler" },
  reading: { variant: "gold", label: "Lendo" },
  paused: { variant: "olive", label: "Pausada" },
  finished: { variant: "moss", label: "Concluída" },
  abandoned: { variant: "burgundy", label: "Abandonada" },
};

export type StatusBadgeProps =
  | { kind: "reading"; status: LegacyReadingStatus | null | undefined; size?: BadgeSize }
  | { kind: "ownership"; status: OwnershipStatus | null | undefined; size?: BadgeSize }
  | { kind: "serie"; status: SerieStatus | null | undefined; size?: BadgeSize };

export default function StatusBadge(props: StatusBadgeProps) {
  if (!props.status) return null;
  const config =
    props.kind === "reading"
      ? readingMap[props.status as LegacyReadingStatus]
      : props.kind === "ownership"
        ? ownershipMap[props.status as OwnershipStatus]
        : serieMap[props.status as SerieStatus];

  if (!config) return null;

  return (
    <Badge variant={config.variant} size={props.size}>
      {config.label}
    </Badge>
  );
}
