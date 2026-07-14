import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function Table({ children, className = "", ...rest }: HTMLAttributes<HTMLTableElement> & { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[2px] border border-rc-ink">
      <table className={`w-full border-collapse text-sm ${className}`} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return <thead className="bg-rc-kraft">{children}</thead>;
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function Tr({ children, className = "", ...rest }: HTMLAttributes<HTMLTableRowElement> & { children: ReactNode }) {
  return (
    <tr
      className={`border-b border-rc-line last:border-b-0 transition-colors hover:bg-rc-kraft/40 ${className}`}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function Th({
  children,
  numeric = false,
  className = "",
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & { children: ReactNode; numeric?: boolean }) {
  return (
    <th
      className={`border-b-2 border-rc-ink px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-rc-gold-dark ${
        numeric ? "text-right font-mono" : "text-left"
      } ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  numeric = false,
  className = "",
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & { children: ReactNode; numeric?: boolean }) {
  return (
    <td
      className={`px-4 py-3 text-rc-ink ${numeric ? "text-right font-mono tabular-nums" : ""} ${className}`}
      {...rest}
    >
      {children}
    </td>
  );
}
