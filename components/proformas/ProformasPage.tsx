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
  const [query, setQuery] = useState("");
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceQuery = useMemo(() => query, [query]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadProformas(debounceQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [debounceQuery]);

  async function loadProformas(search: string) {
    setLoading(true);
    const res = await fetch(
      `/api/proformas?q=${encodeURIComponent(search)}&take=20`
    );
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
    await loadProformas(query);
  }

  async function handleDuplicate(id: string) {
    const res = await fetch(`/api/proformas/${id}/duplicate`, {
      method: "POST",
    });
    if (!res.ok) {
      setError("No se pudo duplicar la proforma.");
      return;
    }
    await loadProformas(query);
  }

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
            Proformas
          </p>
          <h2 className="font-[var(--font-cormorant)] text-2xl font-semibold">
            {total} documentos
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            className="w-full rounded-full border border-[var(--border)] bg-[var(--paper)] px-4 py-2 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition sm:w-64"
            placeholder="Buscar por numero o cliente"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Link
            className="rounded-full bg-[var(--amber)] px-5 py-2 text-sm font-semibold text-[var(--button-text)] shadow transition hover:-translate-y-0.5 hover:bg-[var(--amber-strong)] hover:shadow-md"
            href="/proformas/new"
          >
            Nueva proforma
          </Link>
        </div>
      </div>

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
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm uppercase tracking-[0.2em] text-[var(--cocoa)]">
                    {proforma.number}
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${statusStyles[proforma.status]}`}
                  >
                    {statusLabel[proforma.status]}
                  </span>
                </div>
                <p className="font-semibold">
                  {proforma.clientNombre} - {proforma.clientEmpresa}
                </p>
                <p className="text-xs text-[var(--cocoa)]">
                  Total {formatCRC(toNumber(proforma.total))}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:border-[var(--amber-strong)] hover:text-[var(--accent)]"
                  href={`/proformas/${proforma.id}/edit`}
                >
                  Editar
                </Link>
                <button
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:border-[var(--amber-strong)] hover:text-[var(--accent)]"
                  onClick={() => handleDuplicate(proforma.id)}
                >
                  Duplicar
                </button>
                <a
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:border-[var(--amber-strong)] hover:text-[var(--accent)]"
                  href={`/api/proformas/${proforma.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                >
                  PDF
                </a>
                <button
                  className="rounded-full border border-red-200 px-4 py-2 text-xs uppercase tracking-[0.2em] text-red-600 transition hover:border-red-400 hover:text-red-700"
                  onClick={() => handleDelete(proforma.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}





