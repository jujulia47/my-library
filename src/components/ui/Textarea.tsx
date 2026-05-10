"use client";

import clsx from "clsx";
import {
  forwardRef,
  useId,
  type TextareaHTMLAttributes,
} from "react";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  helperText?: string;
  errorText?: string;
  containerClassName?: string;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    helperText,
    errorText,
    className,
    containerClassName,
    id,
    disabled,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const textareaId = id ?? reactId;
  const hasError = Boolean(errorText);

  return (
    <div className={clsx("space-y-1.5", containerClassName)}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-body font-medium text-ink-deep"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        {...rest}
        className={clsx(
          "w-full rounded-md border bg-ivory-light text-ink-deep placeholder:text-ink-fade",
          "px-3 py-2.5 font-body min-h-32",
          "focus:outline-none focus:ring-2 transition-colors duration-150",
          hasError
            ? "border-burgundy focus:border-burgundy focus:ring-burgundy/20"
            : "border-border focus:border-gold focus:ring-gold/20",
          disabled && "opacity-60 cursor-not-allowed",
          className,
        )}
      />
      {hasError ? (
        <p className="text-xs font-body text-burgundy">{errorText}</p>
      ) : helperText ? (
        <p className="text-xs font-body text-ink-fade">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Textarea;
