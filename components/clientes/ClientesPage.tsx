"use client";

import { useEffect, useMemo, useState } from "react";

type Cliente = {
  id: string;
  nombre: string;
  empresa: string;
  cedulaJuridica: string;
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
  }

  function startEdit(cliente: Cliente) {
    setEditingId(cliente.id);
    setForm({
      nombre: cliente.nombre,
      empresa: cliente.empresa,
      cedulaJuridica: cliente.cedulaJuridica,
    });
    setError(null);
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
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
              Clientes
            </p>
            <h2 className="font-[var(--font-cormorant)] text-2xl font-semibold">
              {total} registros
            </h2>
          </div>
          <input
            className="w-full rounded-full border border-[var(--border)] bg-[var(--paper)] px-4 py-2 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition sm:w-64"
            placeholder="Buscar por nombre, empresa o cedula"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
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
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <p className="font-semibold">{cliente.nombre}</p>
                  <p className="text-xs text-[var(--cocoa)]">
                    {cliente.empresa} - {cliente.cedulaJuridica}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:border-[var(--amber-strong)] hover:text-[var(--accent)]"
                    onClick={() => startEdit(cliente)}
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-full border border-red-200 px-4 py-2 text-xs uppercase tracking-[0.2em] text-red-600 transition hover:border-red-400 hover:text-red-700"
                    onClick={() => handleDelete(cliente.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
              {editingId ? "Editar" : "Nuevo"} cliente
            </p>
            <h3 className="font-[var(--font-cormorant)] text-xl font-semibold">
              Datos base
            </h3>
          </div>
          {editingId ? (
            <button
              className="text-xs uppercase tracking-[0.2em] text-[var(--accent)] transition hover:text-[var(--amber-strong)]"
              onClick={startCreate}
            >
              Limpiar
            </button>
          ) : null}
        </div>

        <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
          <input
            className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(event) => setForm({ ...form, nombre: event.target.value })}
            required
          />
          <input
            className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
            placeholder="Empresa"
            value={form.empresa}
            onChange={(event) => setForm({ ...form, empresa: event.target.value })}
            required
          />
          <input
            className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
            placeholder="Cedula juridica"
            value={form.cedulaJuridica}
            onChange={(event) =>
              setForm({ ...form, cedulaJuridica: event.target.value })
            }
            required
          />
          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <button className="rounded-full bg-[var(--amber)] px-5 py-3 text-sm font-semibold text-[var(--button-text)] shadow transition hover:-translate-y-0.5 hover:bg-[var(--amber-strong)] hover:shadow-md">
            {editingId ? "Guardar cambios" : "Crear cliente"}
          </button>
        </form>
      </section>
    </div>
  );
}





