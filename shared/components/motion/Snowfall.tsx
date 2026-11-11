"use client";

import { usePathname } from "next/navigation";

const FLAKES = [
  { left: "2%", size: 8, duration: 13, delay: -2, drift: 18, opacity: 0.75 },
  { left: "7%", size: 5, duration: 10, delay: -7, drift: -14, opacity: 0.6 },
  { left: "12%", size: 9, duration: 16, delay: -4, drift: 22, opacity: 0.8 },
  { left: "18%", size: 4, duration: 9, delay: -1, drift: -10, opacity: 0.55 },
  { left: "23%", size: 7, duration: 14, delay: -9, drift: 16, opacity: 0.7 },
  { left: "29%", size: 10, duration: 18, delay: -3, drift: -20, opacity: 0.85 },
  { left: "34%", size: 5, duration: 11, delay: -6, drift: 12, opacity: 0.6 },
  { left: "40%", size: 8, duration: 15, delay: -11, drift: -18, opacity: 0.75 },
  { left: "46%", size: 4, duration: 9, delay: -5, drift: 10, opacity: 0.5 },
  { left: "51%", size: 9, duration: 17, delay: -8, drift: -22, opacity: 0.8 },
  { left: "56%", size: 6, duration: 12, delay: -2, drift: 14, opacity: 0.65 },
  { left: "62%", size: 5, duration: 10, delay: -13, drift: -12, opacity: 0.55 },
  { left: "67%", size: 10, duration: 19, delay: -6, drift: 24, opacity: 0.85 },
  { left: "73%", size: 4, duration: 9, delay: -10, drift: -8, opacity: 0.5 },
  { left: "78%", size: 8, duration: 14, delay: -4, drift: 16, opacity: 0.7 },
  { left: "83%", size: 6, duration: 13, delay: -12, drift: -16, opacity: 0.65 },
  { left: "88%", size: 9, duration: 16, delay: -1, drift: 20, opacity: 0.8 },
  { left: "93%", size: 5, duration: 11, delay: -7, drift: -14, opacity: 0.6 },
  { left: "97%", size: 8, duration: 15, delay: -9, drift: 18, opacity: 0.75 },
  { left: "15%", size: 6, duration: 12, delay: -15, drift: -10, opacity: 0.6 },
  { left: "37%", size: 4, duration: 8, delay: -16, drift: 8, opacity: 0.5 },
  { left: "60%", size: 8, duration: 14, delay: -14, drift: -20, opacity: 0.7 },
  { left: "81%", size: 5, duration: 10, delay: -17, drift: 12, opacity: 0.55 },
  { left: "9%", size: 9, duration: 17, delay: -18, drift: -24, opacity: 0.75 },
] as const;

export function Snowfall() {
  const pathname = usePathname();
  if (pathname?.includes("/print")) return null;

  return (
    <div className="snowfall" aria-hidden="true">
      {FLAKES.map((flake, i) => (
        <span
          key={i}
          className="snowfall-flake"
          style={{
            left: flake.left,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
            "--drift": `${flake.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
