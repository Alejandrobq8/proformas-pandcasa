"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClientAutocomplete } from "./ClientAutocomplete";
import { formatCRC } from "@/lib/money";

type Item = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

type ProformaData = {
  id?: string;
  clientId?: string | null;
  clientNombre: string;
  clientEmpresa: string;
  clientCedulaJuridica: string;
  discount?: number | null;
  notes?: string | null;
  items: Array<Omit<Item, "id">>;
};

function makeItem(): Item {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}

export function ProformaForm({ initial }: { initial?: ProformaData }) {
  const router = useRouter();
  const [clientId, setClientId] = useState(initial?.clientId ?? null);
  const [clientNombre, setClientNombre] = useState(
    initial?.clientNombre ?? ""
  );
  const [clientEmpresa, setClientEmpresa] = useState(
    initial?.clientEmpresa ?? ""
  );
  const [clientCedulaJuridica, setClientCedulaJuridica] = useState(
    initial?.clientCedulaJuridica ?? ""
  );
  const [discount, setDiscount] = useState<number>(initial?.discount ?? 0);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [items, setItems] = useState<Item[]>(
    initial?.items?.length
      ? initial.items.map((item) => ({ ...item, id: makeItem().id }))
      : [makeItem()]
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      ),
    [items]
  );
  const total = subtotal - (discount || 0);

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, makeItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      clientId,
      clientNombre,
      clientEmpresa,
      clientCedulaJuridica,
      discount: discount || 0,
      notes,
      items,
    };

    const res = await fetch(
      initial?.id ? `/api/proformas/${initial.id}` : "/api/proformas",
      {
        method: initial?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      setError("No se pudo guardar la proforma.");
      setSaving(false);
      return;
    }

    router.push("/proformas");
  }

  return (
    <form className="grid gap-8" onSubmit={handleSubmit}>
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
              Cliente
            </p>
            <h3 className="font-[var(--font-cormorant)] text-2xl font-semibold">
              Seleccion y datos
            </h3>
          </div>
          <a
            className="text-xs uppercase tracking-[0.2em] text-[var(--accent)] transition hover:text-[var(--amber-strong)]"
            href="/clientes"
          >
            Nuevo cliente
          </a>
        </div>

        <div className="mt-4 grid gap-3">
          <ClientAutocomplete
            onSelect={(cliente) => {
              setClientId(cliente.id);
              setClientNombre(cliente.nombre);
              setClientEmpresa(cliente.empresa);
              setClientCedulaJuridica(cliente.cedulaJuridica);
            }}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
              placeholder="Nombre"
              value={clientNombre}
              onChange={(event) => setClientNombre(event.target.value)}
              required
            />
            <input
              className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
              placeholder="Empresa"
              value={clientEmpresa}
              onChange={(event) => setClientEmpresa(event.target.value)}
              required
            />
          </div>
          <input
            className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
            placeholder="Cedula juridica"
            value={clientCedulaJuridica}
            onChange={(event) => setClientCedulaJuridica(event.target.value)}
            required
          />
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
              Items
            </p>
            <h3 className="font-[var(--font-cormorant)] text-2xl font-semibold">
              Detalle de la proforma
            </h3>
          </div>
          <button
            type="button"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:border-[var(--amber-strong)] hover:text-[var(--accent)]"
            onClick={addItem}
          >
            Agregar item
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-3 md:grid-cols-[2fr,1fr,1fr,auto]"
            >
              <textarea
                className="min-h-[72px] rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
                placeholder="Descripcion (puedes usar varias lineas y vinetas)"
                value={item.description}
                onChange={(event) =>
                  updateItem(index, { description: event.target.value })
                }
                required
              />
              <input
                className="rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
                type="number"
                min={1}
                value={item.quantity}
                onChange={(event) =>
                  updateItem(index, { quantity: Number(event.target.value) })
                }
                required
              />
              <input
                className="rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
                type="number"
                min={0}
                step="0.01"
                value={item.unitPrice}
                onChange={(event) =>
                  updateItem(index, { unitPrice: Number(event.target.value) })
                }
                required
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--cocoa)]">
                  {formatCRC(item.quantity * item.unitPrice)}
                </span>
                {items.length > 1 ? (
                  <button
                    type="button"
                    className="text-xs uppercase tracking-[0.2em] text-red-600 transition hover:text-red-700"
                    onClick={() => removeItem(index)}
                  >
                    Quitar
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
              Notas
            </p>
            <textarea
              className="mt-2 min-h-[120px] w-full rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Condiciones, plazos o detalles adicionales."
            />
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
              Totales
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCRC(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span>Descuento</span>
                <input
                  className="w-28 rounded-xl border border-[var(--border)] bg-[var(--paper)] px-2 py-1 text-right text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
                  type="number"
                  min={0}
                  step="0.01"
                  value={discount}
                  onChange={(event) => setDiscount(Number(event.target.value))}
                />
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatCRC(total)}</span>
              </div>
            </div>
          </div>
        </div>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </section>

      <button
        className="w-full rounded-full bg-[var(--amber)] px-6 py-3 text-sm font-semibold text-[var(--button-text)] shadow transition hover:-translate-y-0.5 hover:bg-[var(--amber-strong)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        disabled={saving}
        type="submit"
      >
        {saving ? "Guardando..." : "Guardar proforma"}
      </button>
    </form>
  );
}






