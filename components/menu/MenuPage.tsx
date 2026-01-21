"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCRC } from "@/lib/money";

type MenuItem = {
  id: string;
  category: "BOCADILLOS" | "POSTRES" | "QUEQUES";
  name: string;
  description: string | null;
  price: number | string;
};

const categories: Array<{ value: MenuItem["category"]; label: string }> = [
  { value: "BOCADILLOS", label: "Bocadillos" },
  { value: "POSTRES", label: "Postres" },
  { value: "QUEQUES", label: "Queques" },
];

const emptyForm: {
  category: MenuItem["category"];
  name: string;
  description: string;
  price: string;
} = {
  category: "BOCADILLOS",
  name: "",
  description: "",
  price: "",
};

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    return Number((value as { toString: () => string }).toString());
  }
  return 0;
}

export function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<
    MenuItem["category"]
  >("BOCADILLOS");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "form">("list");

  const debounceQuery = useMemo(() => query, [query]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadItems(debounceQuery, activeCategory);
    }, 300);
    return () => clearTimeout(timeout);
  }, [debounceQuery, activeCategory]);

  useEffect(() => {
    if (!success) return;
    const timeout = setTimeout(() => setSuccess(null), 1000);
    return () => clearTimeout(timeout);
  }, [success]);

  async function loadItems(search: string, category: MenuItem["category"]) {
    setLoading(true);
    const res = await fetch(
      `/api/menu-items?q=${encodeURIComponent(search)}&category=${category}`
    );
    const payload = await res.json();
    setItems(payload.data ?? []);
    setTotal(payload.total ?? 0);
    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm, category: activeCategory });
    setError(null);
  }

  function startCreate() {
    resetForm();
    setSuccess(null);
    setActiveTab("form");
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setForm({
      category: item.category,
      name: item.name,
      description: item.description ?? "",
      price: String(item.price ?? ""),
    });
    setError(null);
    setSuccess(null);
    setActiveTab("form");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const priceNumber = Number(String(form.price).replace(",", "."));
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setError("Precio invalido.");
      return;
    }

    const payload = {
      category: form.category,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: priceNumber,
    };

    const res = await fetch(
      editingId ? `/api/menu-items/${editingId}` : "/api/menu-items",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const response = await res.json().catch(() => null);
      setError(response?.error ?? "No se pudo guardar el producto.");
      return;
    }

    resetForm();
    setSuccess(editingId ? "Producto actualizado." : "Producto agregado.");
    setActiveTab("list");
    await loadItems(query, activeCategory);
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar producto?")) return;
    const res = await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const response = await res.json().catch(() => null);
      setError(response?.error ?? "No se pudo eliminar el producto.");
      return;
    }
    await loadItems(query, activeCategory);
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
          Menu
        </p>
        <h1 className="mt-2 font-[var(--font-cormorant)] text-3xl font-semibold">
          Menu de productos
        </h1>
        <p className="mt-3 text-sm text-[var(--cocoa)]">
          Administra bocadillos, postres y queques con sus precios.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category.value}
            type="button"
            className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] text-center transition ${
              activeCategory === category.value
                ? "border-[var(--amber-strong)] text-[var(--accent)]"
                : "border-[var(--border)] hover:border-[var(--amber-strong)] hover:text-[var(--accent)]"
            }`}
            onClick={() => {
              setActiveCategory(category.value);
              if (!editingId) {
                setForm((prev) => ({ ...prev, category: category.value }));
              }
            }}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8">
        {activeTab === "list" ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
                Productos
              </p>
              <h2 className="font-[var(--font-cormorant)] text-2xl font-semibold">
                {total} registrados
              </h2>
            </div>
            <div className="flex w-full flex-wrap gap-3 sm:w-auto">
              <input
                className="w-full rounded-full border border-[var(--border)] bg-[var(--paper)] px-4 py-2 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition sm:w-64"
                placeholder="Buscar por nombre"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button
                type="button"
                className="rounded-full bg-[var(--amber)] px-5 py-2 text-sm font-semibold text-[var(--button-text)] shadow transition hover:-translate-y-0.5 hover:bg-[var(--amber-strong)] hover:shadow-md"
                onClick={startCreate}
              >
                Nuevo producto
              </button>
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </p>
          ) : null}

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-[var(--cocoa)]">Cargando...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-[var(--cocoa)]">
                No hay productos en esta categoria.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    {item.description ? (
                      <p className="text-xs text-[var(--cocoa)]">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[var(--sand)] px-3 py-1 text-xs font-semibold text-[var(--cocoa)]">
                      {formatCRC(toNumber(item.price))}
                    </span>
                    <button
                      className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-center transition hover:border-[var(--amber-strong)] hover:text-[var(--accent)]"
                      onClick={() => startEdit(item)}
                    >
                      Editar
                    </button>
                    <button
                      className="bin-button"
                      onClick={() => handleDelete(item.id)}
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
                        <mask id={`bin-mask-${item.id}`} fill="white">
                          <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z" />
                        </mask>
                        <path
                          d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
                          fill="white"
                          mask={`url(#bin-mask-${item.id})`}
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
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
                {editingId ? "Editar" : "Nuevo"} producto
              </p>
              <h3 className="font-[var(--font-cormorant)] text-xl font-semibold">
                Datos del producto
              </h3>
            </div>
            {editingId ? (
              <button
                className="text-xs uppercase tracking-[0.2em] text-[var(--accent)] transition hover:text-[var(--amber-strong)]"
                onClick={startCreate}
                type="button"
              >
                Limpiar
              </button>
            ) : null}
            <button
              className="text-xs uppercase tracking-[0.2em] text-[var(--accent)] transition hover:text-[var(--amber-strong)]"
              onClick={() => setActiveTab("list")}
              type="button"
            >
              Ver listado
            </button>
          </div>

          <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
              Categoria
              <select
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
                value={form.category}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    category: event.target.value as MenuItem["category"],
                  }))
                }
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <input
              className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
              placeholder="Nombre"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
            <textarea
              className="min-h-[90px] rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
              placeholder="Descripcion (opcional)"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
            <input
              className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
              placeholder="Precio (CRC)"
              value={form.price}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  price: event.target.value,
                }))
              }
              required
            />
            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </p>
            ) : null}
            <button className="rounded-full bg-[var(--amber)] px-5 py-3 text-sm font-semibold text-[var(--button-text)] shadow transition hover:-translate-y-0.5 hover:bg-[var(--amber-strong)] hover:shadow-md">
              {editingId ? "Guardar cambios" : "Guardar producto"}
            </button>
          </form>
        </section>
        )}
      </div>
    </section>
  );
}
