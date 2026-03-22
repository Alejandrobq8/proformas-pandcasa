import type { ReactNode } from "react";
import { PageTransition } from "./PageTransition";
import { TopNav } from "./TopNav";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="ambient-orb ambient-orb-one" />
        <div className="ambient-orb ambient-orb-two" />
        <div className="ambient-grid" />
      </div>
      <TopNav />
      <main className="relative mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8 lg:px-10">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
