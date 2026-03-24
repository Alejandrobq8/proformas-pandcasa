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

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadClientes(debounceQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [debounceQuery]);

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
      <section className="hero-panel rounded-[2rem] px-6 py-7 sm:px-8 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/72">
              Clientes
            </p>
            <h2 className="mt-3 font-[var(--font-cormorant)] text-3xl font-semibold sm:text-4xl">
              Base de clientes con acciones rapidas y mejor lectura.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/82">
              Busca, edita y registra contactos desde una vista mas ordenada,
              con entradas suaves y tarjetas mas vivas.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[1.4rem] border border-white/18 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-white/68">
                Registros
              </p>
              <p className="mt-2 font-[var(--font-cormorant)] text-3xl font-semibold">
                {total}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-white/18 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-white/68">
                Busqueda
              </p>
              <p className="mt-2 text-sm font-semibold text-white/88">
                Nombre, empresa o cedula
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-white/18 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-white/68">
                Flujo
              </p>
              <p className="mt-2 text-sm font-semibold text-white/88">
                Alta y edicion en una sola vista
              </p>
            </div>
          </div>
        </div>
      </section>

      {activeTab === "list" ? (
        <section className="tab-pane surface-panel rounded-[2rem] p-6 sm:p-7">
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
              className="w-full rounded-full border border-[var(--border)] bg-white/45 px-4 py-2 text-sm shadow-sm transition focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] sm:w-72"
              placeholder="Buscar por nombre, empresa o cedula"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              type="button"
              className="btn-primary w-full rounded-full px-5 py-2 text-center text-sm font-semibold sm:w-auto"
              onClick={startCreate}
            >
              Nuevo cliente
            </button>
          </div>
        </div>

        <div className="stagger-children mt-6 space-y-4">
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
                className="interactive-card flex flex-col gap-3 rounded-[1.6rem] border border-[var(--border)] bg-white/35 px-4 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between"
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
                <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto sm:justify-end">
                  <button
                    className="editBtn"
                    onClick={() => startEdit(cliente)}
                    type="button"
                    aria-label="Editar"
                    title="Editar"
                  >
                    <svg height="1em" viewBox="0 0 512 512" aria-hidden="true">
                      <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
                    </svg>
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
        <section className="tab-pane surface-panel rounded-[2rem] p-6 sm:p-7">
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
              className="btn-primary w-full rounded-full px-5 py-2 text-center text-sm font-semibold sm:w-auto"
              onClick={() => setActiveTab("list")}
            >
              Ver listado
            </button>

          </div>

          <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
            <input
              className="rounded-[1.25rem] border border-[var(--border)] bg-white/45 px-4 py-3 text-sm shadow-sm transition focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)]"
              placeholder="Nombre"
              value={form.nombre}
              onChange={(event) =>
                setForm({ ...form, nombre: event.target.value })
              }
              required
            />
            <input
              className="rounded-[1.25rem] border border-[var(--border)] bg-white/45 px-4 py-3 text-sm shadow-sm transition focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)]"
              placeholder="Empresa"
              value={form.empresa}
              onChange={(event) =>
                setForm({ ...form, empresa: event.target.value })
              }
            />
            <input
              className="rounded-[1.25rem] border border-[var(--border)] bg-white/45 px-4 py-3 text-sm shadow-sm transition focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)]"
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
          <button className="btn-primary rounded-full px-5 py-3 text-sm font-semibold">
            {editingId ? "Guardar cambios" : "Crear cliente"}
          </button>
        </form>
      </section>
      )}
    </div>
  );
}
