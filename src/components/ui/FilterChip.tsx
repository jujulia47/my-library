"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type FilterChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  children?: ReactNode;
};

export default function FilterChip({
  active = false,
  className,
  children,
  type,
  ...rest
}: FilterChipProps) {
  return (
    <button
      type={type ?? "button"}
      {...rest}
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-body font-medium tracking-wide transition-colors duration-150",
        active
          ? "bg-ink-deep text-ivory border-ink-deep"
          : "bg-ivory-light text-ink-soft border-border hover:bg-paper",
        className,
      )}
    >
      {children}
    </button>
  );
}
