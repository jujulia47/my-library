import type { ReactNode } from "react";
import clsx from "clsx";

export type PageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={clsx(
        "flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-4 mb-8",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="font-display text-[28px] font-medium leading-tight text-ink-deep">
          {title}
        </h1>
        {subtitle && (
          <p className="font-body italic text-ink-fade text-base">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </header>
  );
}
