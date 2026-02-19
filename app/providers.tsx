"use client";

import { useEffect, useMemo, useState } from "react";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { Toaster } from "sileo";

export function Providers({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(max-width: 768px)");
    const handleChange = (event: MediaQueryListEvent) =>
      setIsMobile(event.matches);
    setIsMobile(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const toastOptions = useMemo(
    () => ({
      roundness: 18,
      fill: "var(--toast-bg)",
      styles: {
        title:
          "text-[var(--toast-foreground)] font-bold tracking-wide text-[13px]",
        description: "text-[var(--toast-muted)] text-sm font-semibold",
        button: "text-[var(--accent)]",
      },
    }),
    []
  );

  return (
    <SessionProvider>
      <Toaster position="top-center" offset={16} options={toastOptions} />
      {children}
    </SessionProvider>
  );
}
