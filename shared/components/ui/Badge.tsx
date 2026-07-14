import type { ReactNode } from "react";

type Tone = "neutral" | "gold" | "success" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-[#8a7f6c] text-[#8a7f6c]",
  gold: "border-rc-gold-dark text-rc-gold-dark",
  success: "border-[#4a6b46] text-[#4a6b46]",
  danger: "border-rc-stamp text-rc-stamp",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-[2px] border font-mono text-[10px] font-bold uppercase tracking-[0.04em] px-2.5 py-[5px] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
