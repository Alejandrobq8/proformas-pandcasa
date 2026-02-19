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
          "text-[var(--foreground)] font-semibold tracking-wide text-[13px]",
        description: "text-[var(--cocoa)] text-sm",
        button: "text-[var(--accent)]",
      },
    }),
    []
  );

  return (
    <SessionProvider>
      <Toaster
        position={isMobile ? "bottom-center" : "top-right"}
        offset={16}
        options={toastOptions}
      />
      {children}
    </SessionProvider>
  );
}
