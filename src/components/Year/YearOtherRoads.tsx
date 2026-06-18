import Link from "next/link";
import Image from "next/image";
import {
  BookOpenIcon,
  PauseCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { BookCoverFallback } from "@/components/ui";
import { formatLongDate } from "@/utils/formatDate";
import type { OtherReadingItem, OtherReadings } from "@/services/yearData";

type Props = {
  data: OtherReadings;
};

/**
 * Painel que reúne leituras que tocaram o ano mas não terminaram — em curso,
 * pausadas, abandonadas. Substitui a presença delas na linha do tempo (que
 * agora lista só os concluídos).
 */
export function YearOtherRoads({ data }: Props) {
  const totals =
    data.reading.length + data.paused.length + data.abandoned.length;
  if (totals === 0) return null;

  return (
    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
      <RoadColumn
        title="Em curso"
        icon={<BookOpenIcon className="w-3.5 h-3.5" />}
        iconColor="#A0843E"
        emptyLabel="Nada em andamento."
        items={data.reading}
        progressOf="current"
        dateLabel="começou"
      />
      <RoadColumn
        title="Pausados"
        icon={<PauseCircleIcon className="w-3.5 h-3.5" />}
        iconColor="#85614B"
        emptyLabel="Nada pausado este ano."
        items={data.paused}
        progressOf="current"
        dateLabel="pausou"
      />
      <RoadColumn
        title="Abandonados"
        icon={<XCircleIcon className="w-3.5 h-3.5" />}
        iconColor="#82393A"
        emptyLabel="Nada abandonado este ano."
        items={data.abandoned}
        progressOf="current"
        dateLabel="abandonou"
      />
    </div>
  );
}

type ColumnProps = {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  items: OtherReadingItem[];
  emptyLabel: string;
  progressOf: "current";
  dateLabel: string;
};

function RoadColumn({
  title,
  icon,
  iconColor,
  items,
  emptyLabel,
  dateLabel,
}: ColumnProps) {
  return (
    <div className="bg-paper border border-paper-soft rounded-lg p-4 flex flex-col">
      <p className="text-xs uppercase tracking-wider text-ink-fade mb-3 flex items-center gap-1.5">
        <span aria-hidden style={{ color: iconColor }}>
          {icon}
        </span>
        {title}
        <span className="ml-auto normal-case tracking-normal text-ink-fade/70 text-[11px]">
          {items.length}
        </span>
      </p>
      {items.length === 0 ? (
        <p className="text-xs italic text-ink-fade">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <RoadItem key={item.reading_id} item={item} dateLabel={dateLabel} />
          ))}
        </ul>
      )}
    </div>
  );
}

function RoadItem({
  item,
  dateLabel,
}: {
  item: OtherReadingItem;
  dateLabel: string;
}) {
  const percent =
    item.pages_total && item.current_page
      ? Math.min(
          100,
          Math.round((item.current_page / item.pages_total) * 100),
        )
      : null;
  const date = item.reference_date ? formatLongDate(item.reference_date) : null;
  return (
    <li>
      <Link
        href={`/book/${item.book_slug}`}
        className="flex items-start gap-2.5 group"
      >
        <div
          className="w-9 flex-shrink-0 relative rounded-sm overflow-hidden border border-ink-deep/15"
          style={{ aspectRatio: "2 / 3" }}
        >
          {item.cover_url ? (
            <Image
              src={item.cover_url}
              alt=""
              fill
              className="object-cover"
              sizes="36px"
            />
          ) : (
            <BookCoverFallback
              title={item.title}
              size="sm"
              className="w-full h-full"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-ink-deep leading-tight line-clamp-2 group-hover:text-gold-deep transition-colors">
            {item.title}
          </p>
          {item.author_name && (
            <p className="text-[11px] italic text-ink-fade truncate">
              {item.author_name}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-ink-fade">
            {percent !== null && (
              <span className="tabular-nums font-medium text-ink-soft">
                {percent}%
              </span>
            )}
            {date && (
              <span className="italic">
                {dateLabel} {date}
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
