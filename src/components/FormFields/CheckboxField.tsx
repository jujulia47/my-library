"use client";

import { CheckboxFieldProps } from "@/utils/typings/formFields";
import clsx from "clsx";

export const CheckboxField = ({
  label,
  className,
  ...props
}: CheckboxFieldProps) => {
  return (
    <label
      className={clsx(
        "inline-flex items-center gap-2 cursor-pointer select-none",
        className,
      )}
    >
      <input type="checkbox" className="sr-only peer" {...props} />
      <span
        className={clsx(
          "w-5 h-5 rounded-md flex items-center justify-center transition-colors duration-150",
          "bg-ivory-light border border-border",
          "peer-checked:bg-moss peer-checked:border-moss",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-moss/40",
        )}
      >
        <svg
          className="w-3 h-3 text-ivory-light opacity-0 peer-checked:opacity-100 transition-opacity"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 8 7 12 13 4" />
        </svg>
      </span>
      <span className="text-sm font-body text-ink-deep">{label}</span>
    </label>
  );
};

export default CheckboxField;
