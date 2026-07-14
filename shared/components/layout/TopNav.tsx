"use client";

import { ThemeToggle } from "@/shared/components/theme/ThemeToggle";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/proformas", label: "Proformas" },
  { href: "/cobros", label: "Cobros" },
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
    <header className="sticky top-0 z-30 border-b-2 border-rc-ink bg-rc-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 sm:px-5 sm:py-3 lg:px-6">
        <Link
          className="group flex min-w-0 items-center gap-2.5"
          href="/"
          onClick={() => setOpen(false)}
        >
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-rc-ink bg-rc-ink p-1 sm:h-12 sm:w-12">
            <Image
              src="/logo.png"
              alt="Pan d' Casa"
              width={56}
              height={56}
              className="h-full w-full rounded-full object-cover"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="truncate font-serif text-lg font-semibold tracking-[0.02em] text-rc-ink sm:text-xl">
              Pan d&apos; Casa
            </p>
            <p className="truncate text-[10px] uppercase tracking-[0.28em] text-rc-gold-dark sm:text-xs">
              Panel de proformas
            </p>
          </div>
        </Link>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-[3px] border border-rc-ink p-2.5 text-rc-ink transition hover:bg-rc-kraft md:hidden"
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
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  className={`rounded-[3px] border px-3.5 py-2 text-sm font-semibold tracking-[0.02em] transition ${
                    active
                      ? "border-rc-ink bg-rc-kraft text-rc-ink"
                      : "border-transparent text-rc-ink/80 hover:border-rc-line hover:bg-rc-kraft/50"
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
        } overflow-hidden border-t border-rc-line bg-rc-paper px-4 transition-all duration-300`}
      >
        <nav className="flex flex-col gap-2 py-4">
          <ThemeToggle />
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                className={`rounded-[3px] border px-3.5 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "border-rc-ink bg-rc-kraft text-rc-ink"
                    : "border-rc-line text-rc-ink/80 hover:bg-rc-kraft/50"
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
