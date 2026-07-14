"use client";

import { useMemo, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Toaster } from "sileo";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

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
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-center" offset={16} options={toastOptions} />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
