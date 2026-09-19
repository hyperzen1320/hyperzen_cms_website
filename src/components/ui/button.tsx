import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  | "subtle"
  | "link";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-ink-50 text-ink-950 hover:bg-white shadow-[0_10px_36px_-14px_rgba(255,255,255,0.5)] hover:shadow-[0_16px_44px_-14px_rgba(255,255,255,0.6)]",
  secondary:
    "border border-white/12 bg-white/[0.04] text-ink-50 hover:border-white/25 hover:bg-white/[0.08]",
  outline: "border border-white/15 text-ink-50 hover:border-white/35 hover:bg-white/[0.05]",
  ghost: "text-ink-100 hover:bg-white/[0.06] hover:text-ink-50",
  subtle: "bg-white/[0.06] text-ink-50 hover:bg-white/[0.1]",
  danger: "bg-danger/90 text-ink-950 hover:bg-danger",
  link: "text-ink-50 underline-offset-4 hover:underline px-0",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-[15px]",
};

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: Omit<CommonProps, "children">) {
  return cn(BASE, VARIANTS[variant], variant === "link" ? "" : SIZES[size], className);
}

export const Button = forwardRef<
  HTMLButtonElement,
  CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(function Button({ variant, size, className, children, ...props }, ref) {
  return (
    <button ref={ref} className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </button>
  );
});

export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
  prefetch,
  ...props
}: CommonProps & {
  href: string;
  prefetch?: boolean;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const isExternal = /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");

  if (isExternal) {
    return (
      <a
        href={href}
        className={buttonClasses({ variant, size, className })}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {children}
    </Link>
  );
}
