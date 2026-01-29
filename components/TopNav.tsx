"use client";

import Link from "next/link";
import { useState } from "react";

export function TopNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="app-shell sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--paper)]/90 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          className="group flex items-center gap-3 rounded-full px-2 py-1 transition hover:bg-[var(--sand)]"
          href="/"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--amber)] to-[var(--accent)] text-base font-semibold text-white shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md sm:h-11 sm:w-11 sm:text-lg">
            PC
          </div>
          <div className="min-w-0">
            <p className="truncate font-[var(--font-cormorant)] text-lg font-semibold tracking-wide sm:text-xl">
              Pan d' Casa
            </p>
            <p className="truncate text-[10px] uppercase tracking-[0.25em] text-[var(--cocoa)] sm:text-xs">
              Proformas
            </p>
          </div>
        </Link>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-[var(--border)] p-2 text-[var(--cocoa)] transition hover:border-[var(--amber-strong)] hover:text-[var(--accent)] md:hidden"
          aria-label="Abrir menu"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <nav className="hidden flex-wrap items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--paper)]/70 px-2 py-1 text-sm font-medium shadow-sm md:flex">
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
            href="/menu"
          >
            Menu
          </Link>
          <Link
            className="rounded-full px-3 py-2 transition-colors hover:bg-[var(--sand)] hover:text-[var(--accent)]"
            href="/configuracion"
          >
            Ajustes
          </Link>
        </nav>
      </div>
      <div
        className={`md:hidden ${open ? "block" : "hidden"} border-t border-[var(--border)] bg-[var(--paper)]/95 px-4 pb-4`}
      >
        <nav className="flex flex-col gap-2 pt-3 text-sm font-medium">
          <Link
            className="rounded-2xl border border-[var(--border)] px-3 py-2 transition-colors hover:border-[var(--amber-strong)] hover:bg-[var(--sand)] hover:text-[var(--accent)]"
            href="/proformas"
            onClick={() => setOpen(false)}
          >
            Proformas
          </Link>
          <Link
            className="rounded-2xl border border-[var(--border)] px-3 py-2 transition-colors hover:border-[var(--amber-strong)] hover:bg-[var(--sand)] hover:text-[var(--accent)]"
            href="/clientes"
            onClick={() => setOpen(false)}
          >
            Clientes
          </Link>
          <Link
            className="rounded-2xl border border-[var(--border)] px-3 py-2 transition-colors hover:border-[var(--amber-strong)] hover:bg-[var(--sand)] hover:text-[var(--accent)]"
            href="/menu"
            onClick={() => setOpen(false)}
          >
            Menu
          </Link>
          <Link
            className="rounded-2xl border border-[var(--border)] px-3 py-2 transition-colors hover:border-[var(--amber-strong)] hover:bg-[var(--sand)] hover:text-[var(--accent)]"
            href="/configuracion"
            onClick={() => setOpen(false)}
          >
            Ajustes
          </Link>
        </nav>
      </div>
    </header>
  );
}
