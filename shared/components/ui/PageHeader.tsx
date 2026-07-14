import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  aside?: ReactNode;
}) {
  return (
    <section className="grid gap-6 border-b-2 border-rc-ink pb-7 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rc-gold-dark">
          {eyebrow}
        </p>
        <h1 className="mt-2.5 font-serif text-3xl font-semibold text-rc-ink sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2.5 max-w-2xl text-sm leading-6 text-rc-ink/70">
            {description}
          </p>
        ) : null}
      </div>
      {aside ? <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">{aside}</div> : null}
    </section>
  );
}
