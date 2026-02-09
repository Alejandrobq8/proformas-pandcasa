"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatCRC } from "@/lib/money";

type Item = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

type Proforma = {
  id: string;
  number: string;
  clientNombre: string;
  clientEmpresa: string;
  status: "DRAFT" | "SENT" | "PAID";
  subtotal: number | string;
  total: number | string;
  items: Item[];
};

type Filters = {
  number: string;
  client: string;
  date: string;
  amountMin: string;
  amountMax: string;
};

const statusLabel: Record<Proforma["status"], string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  PAID: "Pagada",
};

const statusStyles: Record<Proforma["status"], string> = {
  DRAFT: "bg-[var(--sand)] text-[var(--cocoa)]",
  SENT: "bg-[var(--amber)] text-[var(--cocoa)]",
  PAID: "bg-emerald-100 text-emerald-800",
};

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    return Number((value as { toString: () => string }).toString());
  }
  return 0;
}

export function ProformasPage() {
  const [filters, setFilters] = useState<Filters>({
    number: "",
    client: "",
    date: "",
    amountMin: "",
    amountMax: "",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [take, setTake] = useState(20);

  const debounceKey = useMemo(() => JSON.stringify(filters), [filters]);
  const activeFilterCount = useMemo(
    () =>
      Object.values(filters).filter((value) => value.trim().length > 0).length,
    [filters]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadProformas(filters, take);
    }, 300);
    return () => clearTimeout(timeout);
  }, [debounceKey, take]);

  async function loadProformas(searchFilters: Filters, limit: number) {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchFilters.number.trim()) {
      params.set("number", searchFilters.number.trim());
    }
    if (searchFilters.client.trim()) {
      params.set("client", searchFilters.client.trim());
    }
    if (searchFilters.date.trim()) {
      params.set("date", searchFilters.date.trim());
    }
    if (searchFilters.amountMin.trim()) {
      params.set("amountMin", searchFilters.amountMin.trim());
    }
    if (searchFilters.amountMax.trim()) {
      params.set("amountMax", searchFilters.amountMax.trim());
    }
    params.set("take", String(limit));

    const res = await fetch(`/api/proformas?${params.toString()}`);
    const payload = await res.json();
    setProformas(payload.data ?? []);
    setTotal(payload.total ?? 0);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar proforma?")) return;
    const res = await fetch(`/api/proformas/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("No se pudo eliminar la proforma.");
      return;
    }
    await loadProformas(filters, take);
  }

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
            Proformas
          </p>
          <h2 className="font-[var(--font-cormorant)] text-2xl font-semibold">
            {total} documentos
          </h2>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            className="btn-secondary inline-flex items-center justify-center rounded-full border px-5 py-2 text-xs uppercase tracking-[0.2em] text-center transition hover:border-[var(--amber-strong)]"
            onClick={() => setFiltersOpen((prev) => !prev)}
          >
            Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
          <Link
            className="btn-primary w-full rounded-full px-5 py-2 text-center text-sm font-semibold shadow transition hover:-translate-y-0.5 sm:w-auto"
            href="/proformas/new"
          >
            Nueva proforma
          </Link>
        </div>
      </div>

      {filtersOpen ? (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
              Numero
              <input
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)]"
                placeholder="PF-2026-0001"
                value={filters.number}
                onChange={(event) => {
                  setFilters((prev) => ({ ...prev, number: event.target.value }));
                  setTake(20);
                }}
              />
            </label>
            <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
              Cliente
              <input
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)]"
                placeholder="Nombre o empresa"
                value={filters.client}
                onChange={(event) => {
                  setFilters((prev) => ({ ...prev, client: event.target.value }));
                  setTake(20);
                }}
              />
            </label>
            <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
              Fecha
              <input
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)]"
                placeholder="YYYY-MM o YYYY-MM-DD"
                value={filters.date}
                onChange={(event) => {
                  setFilters((prev) => ({ ...prev, date: event.target.value }));
                  setTake(20);
                }}
              />
            </label>
            <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
              Monto desde
              <input
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)]"
                placeholder="₡ 15000"
                value={filters.amountMin}
                onChange={(event) => {
                  setFilters((prev) => ({
                    ...prev,
                    amountMin: event.target.value,
                  }));
                  setTake(20);
                }}
              />
            </label>
            <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
              Monto hasta
              <input
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)]"
                placeholder="₡ 45000"
                value={filters.amountMax}
                onChange={(event) => {
                  setFilters((prev) => ({
                    ...prev,
                    amountMax: event.target.value,
                  }));
                  setTake(20);
                }}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="btn-secondary inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] text-center transition hover:border-[var(--amber-strong)]"
              onClick={() => {
                setFilters({
                  number: "",
                  client: "",
                  date: "",
                  amountMin: "",
                  amountMax: "",
                });
                setTake(20);
              }}
            >
              Limpiar filtros
            </button>
            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
              Mostrar
              <select
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)] focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)]"
                value={take}
                onChange={(event) => setTake(Number(event.target.value))}
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-[var(--cocoa)]">Cargando...</p>
        ) : proformas.length === 0 ? (
          <p className="text-sm text-[var(--cocoa)]">
            No hay proformas aun.
          </p>
        ) : (
          proformas.map((proforma) => (
            <div
              key={proforma.id}
              className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm uppercase tracking-[0.2em] text-[var(--cocoa)]">
                    {proforma.number}
                  </p>
                </div>
                <p className="font-semibold">
                  {proforma.clientNombre} - {proforma.clientEmpresa}
                </p>
                <p className="text-xs text-[var(--cocoa)]">
                  Total {formatCRC(toNumber(proforma.total))}
                </p>
              </div>
              <div className="flex w-full flex-wrap justify-center gap-2 sm:w-auto sm:justify-end">
                <a
                  className="btn-secondary inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] text-center transition hover:border-[var(--amber-strong)]"
                  href={`/api/proformas/${proforma.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                >
                  PDF
                </a>
                <Link
                  className="editBtn"
                  href={`/proformas/${proforma.id}/edit`}
                  aria-label="Editar"
                  title="Editar"
                >
                  <svg height="1em" viewBox="0 0 512 512" aria-hidden="true">
                    <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
                  </svg>
                </Link>
                <button
                  className="bin-button"
                  onClick={() => handleDelete(proforma.id)}
                  type="button"
                  aria-label="Eliminar"
                >
                  <svg
                    className="bin-top"
                    viewBox="0 0 39 7"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <line y1="5" x2="39" y2="5" stroke="white" strokeWidth="4" />
                    <line
                      x1="12"
                      y1="1.5"
                      x2="26.0357"
                      y2="1.5"
                      stroke="white"
                      strokeWidth="3"
                    />
                  </svg>
                  <svg
                    className="bin-bottom"
                    viewBox="0 0 33 39"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <mask id={`bin-mask-${proforma.id}`} fill="white">
                      <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z" />
                    </mask>
                    <path
                      d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
                      fill="white"
                      mask={`url(#bin-mask-${proforma.id})`}
                    />
                    <path d="M12 6L12 29" stroke="white" strokeWidth="4" />
                    <path d="M21 6V29" stroke="white" strokeWidth="4" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {proformas.length < total ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            className="btn-secondary inline-flex items-center justify-center rounded-full border px-5 py-2 text-xs uppercase tracking-[0.2em] text-center transition hover:border-[var(--amber-strong)]"
            onClick={() => setTake((prev) => prev + 20)}
            disabled={loading}
          >
            Cargar más
          </button>
        </div>
      ) : null}
    </section>
  );
}
