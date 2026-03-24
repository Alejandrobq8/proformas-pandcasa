"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
type ThemeToggleVariant = "default" | "navbar";

const STORAGE_KEY = "theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("theme-dark", theme === "dark");
}

export function ThemeToggle({
  variant = "default",
}: {
  variant?: ThemeToggleVariant;
}) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const saved =
      (window.localStorage.getItem(STORAGE_KEY) as Theme | null) ?? null;
    if (saved === "light" || saved === "dark") {
      return saved;
    }

    const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)"
    ).matches;
    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  }

  const isDark = theme === "dark";
  const label = isDark ? "Modo claro" : "Modo oscuro";
  const buttonClassName =
    variant === "navbar"
      ? "btn-secondary inline-flex h-12 w-12 items-center justify-center rounded-full p-0 sm:w-12"
      : "btn-secondary inline-flex h-12 w-full items-center justify-center rounded-full px-4 sm:h-12 sm:w-12 sm:p-0";

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={toggleTheme}
      aria-pressed={theme === "dark"}
      aria-label={label}
      title={label}
    >
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
          isDark
            ? "bg-[var(--accent)]/20 text-[var(--accent)]"
            : "bg-[var(--amber-strong)]/16 text-[var(--amber-strong)]"
        }`}
        aria-hidden="true"
      >
        {isDark ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2" />
            <path d="M12 21v2" />
            <path d="M4.22 4.22l1.42 1.42" />
            <path d="M18.36 18.36l1.42 1.42" />
            <path d="M1 12h2" />
            <path d="M21 12h2" />
            <path d="M4.22 19.78l1.42-1.42" />
            <path d="M18.36 5.64l1.42-1.42" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
          </svg>
        )}
      </span>
    </button>
  );
}
