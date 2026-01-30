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

type ProformaStatus = "DRAFT" | "SENT" | "PAID";

type ProformaData = {
  id?: string;
  clientId?: string | null;
  clientNombre: string;
  clientEmpresa?: string | null;
  clientCedulaJuridica?: string | null;
  showUnitPrice?: boolean;
  discount?: number | null;
  notes?: string | null;
  status?: ProformaStatus;
  items: Array<Omit<Item, "id">>;
};

function makeItem(): Item {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    description: "",
    quantity: 0,
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
  const [showUnitPrice, setShowUnitPrice] = useState(
    initial?.showUnitPrice ?? true
  );
  const [status, setStatus] = useState<ProformaStatus>(
    initial?.status ?? "DRAFT"
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
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      ),
    [items]
  );
  const total = subtotal - (discount || 0);
  const itemsCount = items.length;
  const unitsCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const isEdit = Boolean(initial?.id);
  const previewUrl = isEdit
    ? `/proformas/${initial?.id}/print-template`
    : null;
  const submitLabel = isEdit ? "Guardar cambios" : "Guardar proforma";

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

  async function saveProforma(nextStatus?: ProformaStatus) {
    setError(null);
    setSaving(true);

    const payload = {
      clientId,
      clientNombre,
      clientEmpresa,
      clientCedulaJuridica,
      showUnitPrice,
      discount: discount || 0,
      notes,
      items,
      status: nextStatus ?? status,
    };

    const res = await fetch(
      initial?.id ? `/api/proformas/${initial.id}` : "/api/proformas",
      {
        method: initial?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    let data: { id?: string } | null = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      setError("No se pudo guardar la proforma.");
      setSaving(false);
      return;
    }

    const createdId = data?.id;
    if (!initial?.id && createdId) {
      router.push(`/proformas/${createdId}/edit`);
      return;
    }

    setStatus(nextStatus ?? status);
    setLastSavedAt(
      new Date().toLocaleTimeString("es-CR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
    setPreviewKey(Date.now());
    setSaving(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveProforma();
  }

  return (
    <form className="grid gap-8" onSubmit={handleSubmit}>
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[var(--cocoa)]">
                Paso 1
              </span>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
                Cliente
              </p>
            </div>
            <h3 className="font-[var(--font-cormorant)] text-2xl font-semibold">
              Seleccion y datos
            </h3>
            <p className="mt-2 text-sm text-[var(--cocoa)]">
              Busca un cliente o completa los datos manualmente.
            </p>
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
              setClientEmpresa(cliente.empresa ?? "");
              setClientCedulaJuridica(cliente.cedulaJuridica ?? "");
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
            />
          </div>
          <input
            className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
            placeholder="Cedula juridica (opcional)"
            value={clientCedulaJuridica}
            onChange={(event) => setClientCedulaJuridica(event.target.value)}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[var(--cocoa)]">
                Paso 2
              </span>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
                Items
              </p>
            </div>
            <h3 className="font-[var(--font-cormorant)] text-2xl font-semibold">
              Detalle de la proforma
            </h3>
            <p className="mt-2 text-sm text-[var(--cocoa)]">
              Usa varias lineas para describir cada item con vinetas.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
              <input
                type="checkbox"
                checked={showUnitPrice}
                onChange={(event) => setShowUnitPrice(event.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Mostrar precio unitario en PDF
            </label>
            <button
              type="button"
              className="btn-secondary inline-flex w-full items-center justify-center rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] text-center transition hover:border-[var(--amber-strong)] sm:w-auto"
              onClick={addItem}
            >
              Agregar item
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
                  <span className="rounded-full border border-[var(--border)] px-3 py-1">
                    Item {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-semibold normal-case text-[var(--cocoa)]">
                    Total: {formatCRC(item.quantity * item.unitPrice)}
                  </span>
                </div>
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
              <div className="mt-4 grid gap-3 md:grid-cols-[2fr,1fr,1fr,1fr]">
                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
                    Descripción
                  </label>
                  <textarea
                    className="mt-2 min-h-[96px] w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
                    placeholder="Descripcion (usa lineas nuevas para vinetas)"
                    value={item.description}
                    onChange={(event) =>
                      updateItem(index, { description: event.target.value })
                    }
                    required
                  />
                  <p className="mt-2 text-xs text-[var(--cocoa)]">
                    Primera linea como titulo, el resto como lista.
                  </p>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
                    Cantidad
                  </label>
                  <input
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
                    type="text"
                    inputMode="numeric"
                    value={item.quantity === 0 ? "" : item.quantity}
                    onChange={(event) => {
                      const cleaned = event.target.value.replace(/[^\d]/g, "");
                      updateItem(index, {
                        quantity: cleaned ? Number(cleaned) : 0,
                      });
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
                    Precio unitario
                  </label>
                  <input
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
                    type="text"
                    inputMode="decimal"
                    value={item.unitPrice === 0 ? "" : item.unitPrice}
                    onChange={(event) => {
                      const normalized = event.target.value
                        .replace(",", ".")
                        .replace(/[^\d.]/g, "");
                      updateItem(index, {
                        unitPrice: normalized ? Number(normalized) : 0,
                      });
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
                    Total
                  </label>
                  <input
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
                    type="text"
                    inputMode="decimal"
                    value={
                      item.quantity > 0 && item.unitPrice > 0
                        ? item.quantity * item.unitPrice
                        : ""
                    }
                    onChange={(event) => {
                      const normalized = event.target.value
                        .replace(",", ".")
                        .replace(/[^\d.]/g, "");
                      const totalValue = normalized ? Number(normalized) : 0;
                      const nextUnit =
                        item.quantity > 0 ? totalValue / item.quantity : 0;
                      updateItem(index, {
                        unitPrice: Number.isFinite(nextUnit) ? nextUnit : 0,
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[var(--cocoa)]">
                Paso 3
              </span>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
                Entrega
              </p>
            </div>
            <textarea
              className="mt-2 min-h-[120px] w-full rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Detalles de la entrega."
            />
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
              Resumen
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-[var(--cocoa)]">
              <span>{itemsCount} items</span>
              <span>{unitsCount} unidades</span>
            </div>
            <div className="my-3 h-px bg-[var(--border)]" />
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
        {error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
          {lastSavedAt ? `Guardado ${lastSavedAt}` : "Sin guardar"}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="btn-secondary inline-flex w-full items-center justify-center rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] text-center transition hover:border-[var(--amber-strong)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={saving}
            onClick={() => saveProforma("DRAFT")}
          >
            Guardar borrador
          </button>
          {initial?.id ? (
            <button
              type="button"
              className="btn-secondary inline-flex w-full items-center justify-center rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] text-center transition hover:border-[var(--amber-strong)] sm:w-auto"
              onClick={() => window.open(`/api/proformas/${initial.id}/pdf`, "_blank")}
            >
              Descargar PDF
            </button>
          ) : null}
          {previewUrl ? (
            <button
              type="button"
              className="btn-secondary inline-flex w-full items-center justify-center rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] text-center transition hover:border-[var(--amber-strong)] sm:w-auto"
              onClick={() => window.open(previewUrl, "_blank")}
            >
              Abrir vista previa
            </button>
          ) : null}
          <button
            className="btn-primary w-full rounded-full px-6 py-3 text-center text-sm font-semibold shadow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={saving}
            type="submit"
          >
            {saving ? "Guardando..." : submitLabel}
          </button>
        </div>
      </div>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
              Vista previa
            </p>
            <h3 className="font-[var(--font-cormorant)] text-2xl font-semibold">
              PDF en vivo
            </h3>
          </div>
          <button
            type="button"
            className="btn-secondary inline-flex w-full items-center justify-center rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] text-center transition hover:border-[var(--amber-strong)] sm:w-auto"
            onClick={() => saveProforma()}
            disabled={saving}
          >
            Actualizar vista previa
          </button>
        </div>
        <div className="mt-4">
          {previewUrl ? (
            <iframe
              key={previewKey}
              title="Vista previa PDF"
              className="h-[720px] w-full rounded-2xl border border-[var(--border)] bg-white"
              src={previewUrl}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--cocoa)]">
              Guarda la proforma para ver la vista previa.
            </div>
          )}
        </div>
      </section>
    </form>
  );
}



