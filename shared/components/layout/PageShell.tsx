import type { ReactNode } from "react";
import { PageTransition } from "@/shared/components/motion/PageTransition";
import { TopNav } from "./TopNav";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="rc-paper-texture relative min-h-screen bg-rc-paper">
      <TopNav />
      <main className="relative mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
