import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type Variant = "primary" | "ghost" | "danger";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[3px] border-[1.5px] font-semibold transition-transform duration-150 ease-out disabled:pointer-events-none disabled:opacity-50";

const sizes: Record<Size, string> = {
  md: "px-[22px] py-3 text-sm",
  sm: "px-3.5 py-2 text-xs",
};

const variants: Record<Variant, string> = {
  primary:
    "border-rc-ink bg-rc-ink text-rc-paper hover:-translate-y-0.5 hover:shadow-[3px_4px_0_var(--rc-gold)] active:translate-y-0 active:shadow-none",
  ghost:
    "border-rc-ink bg-transparent text-rc-ink hover:-translate-y-0.5 hover:shadow-[3px_4px_0_var(--rc-line)] active:translate-y-0 active:shadow-none",
  danger:
    "border-rc-stamp bg-transparent text-rc-stamp hover:-translate-y-0.5 hover:bg-rc-stamp hover:text-rc-receipt-paper active:translate-y-0",
};

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  href?: string;
  target?: string;
  rel?: string;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button({
  variant = "primary",
  size = "md",
  href,
  target,
  rel,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const classes = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} target={target} rel={rel}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
