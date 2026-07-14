import type { HTMLAttributes, ReactNode } from "react";

type Variant = "module" | "stat" | "plain";

const variants: Record<Variant, string> = {
  module:
    "border border-rc-ink bg-rc-surface rounded-[2px] p-5 transition-transform duration-150 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--rc-gold)]",
  stat: "border border-rc-line bg-rc-kraft rounded-[3px] p-4",
  plain: "border border-rc-line bg-rc-surface rounded-[2px] p-5",
};

type CardProps = {
  variant?: Variant;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export function Card({ variant = "plain", children, className = "", ...rest }: CardProps) {
  return (
    <div className={`${variants[variant]} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <Card variant="stat" className={className}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rc-gold-dark">
        {label}
      </div>
      <div className="mt-1.5 font-serif text-2xl text-rc-ink">{value}</div>
    </Card>
  );
}
