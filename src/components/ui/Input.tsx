"use client";

import clsx from "clsx";
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    errorText,
    leftIcon,
    rightIcon,
    className,
    containerClassName,
    id,
    disabled,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const hasError = Boolean(errorText);

  return (
    <div className={clsx("space-y-1.5", containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-body font-medium text-ink-deep"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-fade">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          {...rest}
          className={clsx(
            "w-full rounded-md border bg-ivory-light text-ink-deep placeholder:text-ink-fade",
            "px-3 py-2.5 font-body",
            "focus:outline-none focus:ring-2 transition-colors duration-150",
            hasError
              ? "border-burgundy focus:border-burgundy focus:ring-burgundy/20"
              : "border-border focus:border-gold focus:ring-gold/20",
            disabled && "opacity-60 cursor-not-allowed",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className,
          )}
        />
        {rightIcon && (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-ink-fade">
            {rightIcon}
          </span>
        )}
      </div>
      {hasError ? (
        <p className="text-xs font-body text-burgundy">{errorText}</p>
      ) : helperText ? (
        <p className="text-xs font-body text-ink-fade">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
