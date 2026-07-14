import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldBase =
  "rc-input w-full rounded-[3px] border-[1.5px] border-rc-line bg-rc-surface px-3.5 py-2.5 text-sm text-rc-ink placeholder:text-rc-ink/40 transition-shadow duration-150 ease-out outline-none focus:border-rc-ink focus:shadow-[2px_2px_0_var(--rc-gold)]";

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldBase} ${className}`} {...rest} />;
}

export function Textarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldBase} ${className}`} {...rest} />;
}

export function Select({ className = "", ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${fieldBase} ${className}`} {...rest} />;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold uppercase tracking-[0.1em] text-rc-ink/80"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-rc-stamp">{error}</p>
      ) : hint ? (
        <p className="text-xs text-rc-ink/55">{hint}</p>
      ) : null}
    </div>
  );
}
