"use client";

import { useEffect, useState } from "react";

type FormState = {
  name: string;
  contactName: string;
  cedula: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
};

const emptyForm: FormState = {
  name: "",
  contactName: "",
  cedula: "",
  address: "",
  phone: "",
  email: "",
  logoUrl: "",
};

export function CompanySettingsForm() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/company-settings");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setForm({
            name: data.name ?? "",
            contactName: data.contactName ?? "",
            cedula: data.cedula ?? "",
            address: data.address ?? "",
            phone: data.phone ?? "",
            email: data.email ?? "",
            logoUrl: data.logoUrl ?? "",
          });
        }
      }
      setLoading(false);
    }
    void load();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const res = await fetch("/api/company-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      setError("No se pudo guardar la configuracion.");
      setSaving(false);
      return;
    }

    setSuccess("Datos guardados correctamente.");
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
        <p className="text-sm text-[var(--cocoa)]">Cargando...</p>
      </div>
    );
  }

  return (
    <form
      className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
            Nombre de la empresa
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
            Nombre
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
            value={form.contactName}
            onChange={(event) =>
              setForm({ ...form, contactName: event.target.value })
            }
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
            Cedula
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
            value={form.cedula}
            onChange={(event) => setForm({ ...form, cedula: event.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
            Direccion
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
            value={form.address}
            onChange={(event) =>
              setForm({ ...form, address: event.target.value })
            }
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
            Telefono
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
            Email
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            type="email"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
            Logo URL (opcional)
          </label>
          <input
            className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
            value={form.logoUrl}
            onChange={(event) =>
              setForm({ ...form, logoUrl: event.target.value })
            }
            type="url"
          />
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
      <button
        className="mt-6 rounded-full bg-[var(--amber)] px-6 py-3 text-sm font-semibold text-[var(--button-text)] shadow transition hover:-translate-y-0.5 hover:bg-[var(--amber-strong)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        disabled={saving}
        type="submit"
      >
        {saving ? "Guardando..." : "Guardar datos"}
      </button>
    </form>
  );
}



