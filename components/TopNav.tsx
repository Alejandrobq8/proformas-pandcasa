"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/proformas", label: "Proformas" },
  { href: "/clientes", label: "Clientes" },
  { href: "/menu", label: "Menu" },
  { href: "/configuracion", label: "Ajustes" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="app-shell sticky top-0 z-30 border-b backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Link
          className="group flex min-w-0 items-center gap-3 rounded-[1.75rem] border border-white/20 bg-white/30 px-3 py-2 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white/45"
          href="/"
          onClick={() => setOpen(false)}
        >
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1.25rem] border border-white/40 bg-white/65 p-1 shadow-sm transition duration-300 group-hover:scale-[1.03] sm:h-14 sm:w-14">
            <Image
              src="/logo.png"
              alt="Pan d' Casa"
              width={56}
              height={56}
              className="h-full w-full rounded-[1rem] object-cover"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="truncate font-[var(--font-cormorant)] text-xl font-semibold tracking-[0.04em] sm:text-2xl">
              Pan d&apos; Casa
            </p>
            <p className="truncate text-[10px] uppercase tracking-[0.32em] text-[var(--cocoa)] sm:text-xs">
              Panel creativo
            </p>
          </div>
        </Link>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/45 p-3 text-[var(--cocoa)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--amber-strong)] hover:text-[var(--accent)] md:hidden"
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

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle variant="navbar" />
          <nav className="flex items-center gap-2 rounded-[1.75rem] border border-white/20 bg-white/35 p-2 shadow-sm backdrop-blur">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                className={`topnav-link rounded-[1.1rem] px-4 py-2.5 text-sm font-semibold tracking-[0.04em] transition duration-300 ${
                  active
                    ? "bg-[var(--foreground)] text-[var(--paper)] shadow-lg shadow-black/10"
                    : "text-[var(--cocoa)] hover:-translate-y-0.5 hover:bg-white/55 hover:text-[var(--accent)]"
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
          </nav>
        </div>
      </div>

      <div
        className={`md:hidden ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden border-t border-white/15 bg-white/40 px-4 transition-all duration-300`}
      >
        <nav className="flex flex-col gap-2 py-4">
          <ThemeToggle />
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                className={`rounded-[1.2rem] border px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--paper)]"
                    : "border-white/20 bg-white/45 text-[var(--foreground)] hover:border-[var(--amber-strong)] hover:text-[var(--accent)]"
                }`}
                href={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
