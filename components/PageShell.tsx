import type { ReactNode } from "react";
import { TopNav } from "./TopNav";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="relative mx-auto max-w-6xl px-6 pb-20 pt-10 sm:px-10">
        {children}
      </main>
    </div>
  );
}
