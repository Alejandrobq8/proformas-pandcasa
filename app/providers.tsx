"use client";

import { useMemo } from "react";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { Toaster } from "sileo";

export function Providers({ children }: { children: ReactNode }) {
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
