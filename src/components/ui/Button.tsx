"use client";

import clsx from "clsx";
import Link from "next/link";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
  type ComponentProps,
  type ReactNode,
} from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "ghost-destructive"
  | "accent-navy"
  | "accent-moss"
  | "accent-terracota";

export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  // Primary agora usa cappuccino — tom warm leve em estado normal — e escurece
  // pra ink-deep no hover.
  primary:
    "bg-cappuccino text-ivory-light border border-cappuccino hover:bg-ink-deep hover:border-ink-deep",
  secondary:
    "bg-paper-soft text-ink-deep border border-olive hover:bg-paper hover:border-ink-deep",
  ghost:
    "bg-transparent text-ink-deep border border-ink-deep hover:bg-ink-deep/10",
  destructive:
    "bg-burgundy text-ivory-light border border-burgundy hover:bg-burgundy-soft hover:border-burgundy-soft",
  // Sessão 17.3: ação destrutiva leve — "Arquivar", "Limpar tudo", "Remover".
  // Texto burgundy + hover wash. Distingue de `destructive` (preenchido,
  // delete fatal) e de `ghost` (genérico, sem cor de ação).
  "ghost-destructive":
    "bg-transparent text-burgundy border border-transparent hover:bg-burgundy/10 hover:text-burgundy-soft",
  "accent-navy":
    "bg-navy text-ivory-light border border-navy hover:bg-navy-soft hover:border-navy-soft",
  "accent-moss":
    "bg-moss text-ivory-light border border-moss hover:bg-moss-soft hover:border-moss-soft",
  "accent-terracota":
    "bg-terracota text-ivory-light border border-terracota hover:bg-terracota-soft hover:border-terracota-soft",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-7 py-3 text-base",
  lg: "px-9 py-4 text-lg",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-md font-body font-medium tracking-wide transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    as?: "button";
  };

type ButtonAsAnchor = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    as: "a";
    href: string;
  };

type ButtonAsLink = CommonProps &
  Omit<ComponentProps<typeof Link>, keyof CommonProps> & {
    as: "Link";
  };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor | ButtonAsLink;

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
      />
    </svg>
  );
}

const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
  props,
  ref,
) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className,
    children,
    ...rest
  } = props as CommonProps & { as?: "button" | "a" | "Link" };

  const classes = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );

  const inner = (
    <>
      {loading ? <Spinner /> : leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </>
  );

  if ("as" in props && props.as === "a") {
    const { as: _as, ...anchorProps } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & {
      as: "a";
    };
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={classes}
        aria-disabled={loading || undefined}
        {...anchorProps}
      >
        {inner}
      </a>
    );
  }

  if ("as" in props && props.as === "Link") {
    const { as: _as, ...linkProps } = rest as ComponentProps<typeof Link> & {
      as: "Link";
    };
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={classes}
        {...linkProps}
      >
        {inner}
      </Link>
    );
  }

  const { as: _as, disabled, type, ...buttonProps } =
    rest as ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      className={classes}
      type={type ?? "button"}
      disabled={disabled || loading}
      {...buttonProps}
    >
      {inner}
    </button>
  );
});

export default Button;
