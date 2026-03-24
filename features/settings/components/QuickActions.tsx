"use client";

import { signOut } from "next-auth/react";

export function QuickActions() {
  return (
    <div className="surface-panel rounded-[2rem] p-6 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
            Sesion
          </p>
          <h3 className="font-[var(--font-cormorant)] text-2xl font-semibold">
            Acciones rapidas
          </h3>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <button
            type="button"
            className="btn-secondary inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold sm:w-auto"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
