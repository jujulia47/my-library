import type { ReactNode } from "react";
import clsx from "clsx";

export type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center text-center py-16 px-6 gap-3",
        className,
      )}
    >
      {icon && <div className="text-ink-fade mb-2">{icon}</div>}
      <h3 className="font-display text-2xl font-medium text-ink-deep">
        {title}
      </h3>
      {description && (
        <p className="font-body text-ink-soft italic max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
