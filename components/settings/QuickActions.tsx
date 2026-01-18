"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { signOut } from "next-auth/react";

export function QuickActions() {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
            Acciones rapidas
          </p>
          <h3 className="font-[var(--font-cormorant)] text-2xl font-semibold">
            Preferencias y sesion
          </h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <ThemeToggle />
          <button
            type="button"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:border-[var(--amber-strong)] hover:bg-[var(--sand)] hover:text-[var(--accent)]"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
