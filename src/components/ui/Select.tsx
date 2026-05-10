"use client";

import clsx from "clsx";
import {
  forwardRef,
  useId,
  type SelectHTMLAttributes,
  type ReactNode,
} from "react";

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  label?: string;
  helperText?: string;
  errorText?: string;
  options?: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
  children?: ReactNode;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    helperText,
    errorText,
    options,
    placeholder = "Escolha uma opção",
    className,
    containerClassName,
    id,
    disabled,
    children,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const selectId = id ?? reactId;
  const hasError = Boolean(errorText);

  return (
    <div className={clsx("space-y-1.5", containerClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-body font-medium text-ink-deep"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          {...rest}
          className={clsx(
            "w-full appearance-none rounded-md border bg-ivory-light text-ink-deep",
            "px-3 py-2.5 pr-10 font-body",
            "focus:outline-none focus:ring-2 transition-colors duration-150",
            hasError
              ? "border-burgundy focus:border-burgundy focus:ring-burgundy/20"
              : "border-border focus:border-gold focus:ring-gold/20",
            disabled && "opacity-60 cursor-not-allowed",
            className,
          )}
        >
          {children ?? (
            <>
              <option value="">{placeholder}</option>
              {options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </>
          )}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-ink-fade">
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>
      {hasError ? (
        <p className="text-xs font-body text-burgundy">{errorText}</p>
      ) : helperText ? (
        <p className="text-xs font-body text-ink-fade">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Select;
