"use client";

import Link from "next/link";

export function TopNav() {
  return (
    <header className="app-shell sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--paper)] shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          className="flex items-center gap-3 rounded-full px-2 py-1 transition hover:bg-[var(--sand)]"
          href="/"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--amber)] text-lg font-semibold text-white">
            PC
          </div>
          <div>
            <p className="font-[var(--font-cormorant)] text-xl font-semibold tracking-wide">
              Pan d' Casa
            </p>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--cocoa)]">
              Proformas
            </p>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <Link
            className="rounded-full px-3 py-2 transition-colors hover:bg-[var(--sand)] hover:text-[var(--accent)]"
            href="/proformas"
          >
            Proformas
          </Link>
          <Link
            className="rounded-full px-3 py-2 transition-colors hover:bg-[var(--sand)] hover:text-[var(--accent)]"
            href="/clientes"
          >
            Clientes
          </Link>
          <Link
            className="rounded-full px-3 py-2 transition-colors hover:bg-[var(--sand)] hover:text-[var(--accent)]"
            href="/configuracion"
          >
            Ajustes
          </Link>
        </nav>
      </div>
    </header>
  );
}
