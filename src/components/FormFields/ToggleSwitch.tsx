"use client";

import { ToggleFieldProps } from "@/utils/typings/formFields";
import clsx from "clsx";

export const ToggleSwitch = ({
  label,
  className,
  ...props
}: ToggleFieldProps) => {
  const isChecked = Boolean(props.checked);

  return (
    <section className={clsx("flex items-center", className)}>
      <input
        type="checkbox"
        id={props.id}
        className="sr-only peer"
        {...props}
      />
      <label
        htmlFor={props.id}
        className={clsx(
          "relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-150 cursor-pointer border",
          isChecked
            ? "bg-ink-deep border-ink-deep"
            : "bg-paper-soft border-border",
        )}
      >
        <span
          className={clsx(
            "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-ivory-light shadow-sm transition-transform duration-150",
            isChecked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </label>
      {label && (
        <span className="ml-3 text-sm font-body text-ink-deep">{label}</span>
      )}
    </section>
  );
};

export default ToggleSwitch;
