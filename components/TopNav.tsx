"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

export function TopNav() {
  const { data } = useSession();

  return (
    <header className="app-shell sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--paper)] shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
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
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <Link
            className="rounded-full px-3 py-2 transition-colors hover:bg-[var(--sand)] hover:text-[var(--accent)]"
            href="/"
          >
            Inicio
          </Link>
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
            Empresa
          </Link>
          <ThemeToggle />
          {data?.user ? (
            <button
              className="rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:border-[var(--amber-strong)] hover:bg-[var(--sand)] hover:text-[var(--accent)]"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Salir
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
