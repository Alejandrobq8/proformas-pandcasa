"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { signOut } from "next-auth/react";

export function QuickActions() {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
            Acciones rapidas
          </p>
          <h3 className="font-[var(--font-cormorant)] text-2xl font-semibold">
            Preferencias y sesion
          </h3>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <ThemeToggle />
          <button
            type="button"
            className="btn-secondary inline-flex w-full items-center justify-center rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] text-center transition hover:border-[var(--amber-strong)] sm:w-auto"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
