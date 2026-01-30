"use client";

import { useEffect, useMemo, useState } from "react";

type Cliente = {
  id: string;
  nombre: string;
  empresa?: string | null;
  cedulaJuridica?: string | null;
};

const emptyForm = { nombre: "", empresa: "", cedulaJuridica: "" };

export function ClientesPage() {
  const [query, setQuery] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "form">("list");

  const debounceQuery = useMemo(() => query, [query]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadClientes(debounceQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [debounceQuery]);

  async function loadClientes(search: string) {
    setLoading(true);
    const res = await fetch(
      `/api/clientes?q=${encodeURIComponent(search)}&take=25`
    );
    const payload = await res.json();
    setClientes(payload.data ?? []);
    setTotal(payload.total ?? 0);
    setLoading(false);
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setActiveTab("form");
  }

  function startEdit(cliente: Cliente) {
    setEditingId(cliente.id);
    setForm({
      nombre: cliente.nombre,
      empresa: cliente.empresa ?? "",
      cedulaJuridica: cliente.cedulaJuridica ?? "",
    });
    setError(null);
    setActiveTab("form");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const res = await fetch(
      editingId ? `/api/clientes/${editingId}` : "/api/clientes",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "No se pudo guardar el cliente.");
      return;
    }

    startCreate();
    setActiveTab("list");
    await loadClientes(query);
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar cliente?")) return;
    const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "No se pudo eliminar el cliente.");
      return;
    }
    await loadClientes(query);
  }

  return (
    <div className="grid gap-6">

      {activeTab === "list" ? (
        <section className="tab-pane rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
              Clientes
            </p>
            <h2 className="font-[var(--font-cormorant)] text-2xl font-semibold">
              {total} registros
            </h2>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <input
              className="w-full rounded-full border border-[var(--border)] bg-[var(--paper)] px-4 py-2 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition sm:w-64"
              placeholder="Buscar por nombre, empresa o cedula"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              type="button"
              className="btn-primary w-full rounded-full px-5 py-2 text-center text-sm font-semibold shadow transition hover:-translate-y-0.5 sm:w-auto"
              onClick={startCreate}
            >
              Nuevo cliente
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-sm text-[var(--cocoa)]">Cargando...</p>
          ) : clientes.length === 0 ? (
            <p className="text-sm text-[var(--cocoa)]">
              No hay clientes aun.
            </p>
          ) : (
            clientes.map((cliente) => (
              <div
                key={cliente.id}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">{cliente.nombre}</p>
                  {cliente.empresa || cliente.cedulaJuridica ? (
                    <p className="text-xs text-[var(--cocoa)]">
                      {cliente.empresa ?? ""}
                      {cliente.cedulaJuridica
                        ? ` - ${cliente.cedulaJuridica}`
                        : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                  <button
                    className="btn-secondary inline-flex w-full items-center justify-center rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] text-center transition hover:border-[var(--amber-strong)] sm:w-auto"
                    onClick={() => startEdit(cliente)}
                  >
                    Editar
                  </button>
                  <button
                    className="bin-button"
                    onClick={() => handleDelete(cliente.id)}
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
                      <mask id={`bin-mask-${cliente.id}`} fill="white">
                        <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z" />
                      </mask>
                      <path
                        d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
                        fill="white"
                        mask={`url(#bin-mask-${cliente.id})`}
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
        </section>
      ) : (
        <section className="tab-pane rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
                {editingId ? "Editar" : "Nuevo"} cliente
              </p>
              <h3 className="font-[var(--font-cormorant)] text-xl font-semibold">
                Datos base
              </h3>
            </div>
            <button
              type="button"
              className="btn-primary w-full rounded-full px-5 py-2 text-center text-sm font-semibold shadow transition hover:-translate-y-0.5 sm:w-auto"
              onClick={() => setActiveTab("list")}
            >
              Ver listado
            </button>

          </div>

          <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
            <input
              className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
              placeholder="Nombre"
              value={form.nombre}
              onChange={(event) =>
                setForm({ ...form, nombre: event.target.value })
              }
              required
            />
            <input
              className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
              placeholder="Empresa"
              value={form.empresa}
              onChange={(event) =>
                setForm({ ...form, empresa: event.target.value })
              }
            />
            <input
              className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
              placeholder="Cedula juridica (opcional)"
              value={form.cedulaJuridica}
              onChange={(event) =>
                setForm({ ...form, cedulaJuridica: event.target.value })
              }
            />
            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
          <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold shadow transition hover:-translate-y-0.5">
            {editingId ? "Guardar cambios" : "Crear cliente"}
          </button>
        </form>
      </section>
      )}
    </div>
  );
}
