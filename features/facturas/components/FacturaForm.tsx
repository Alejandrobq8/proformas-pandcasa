"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import { ClientAutocomplete } from "@/features/proformas/components/ClientAutocomplete";
import { facturaSchema, type FacturaInput } from "@/features/facturas/schema";
import { formatCRC } from "@/shared/lib/money";
import { Card } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Field, Input, Textarea } from "@/shared/components/ui/Input";

type FacturaData = {
  id?: string;
  clientId?: string | null;
  clientNombre: string;
  clientCedula?: string | null;
  issueDate: string;
  showUnitPrice?: boolean;
  discount?: number | null;
  notes?: string | null;
  items: FacturaInput["items"];
};

function todayInCostaRica() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Costa_Rica" });
}

function buildDefaultValues(initial?: FacturaData): FacturaInput {
  return {
    clientId: initial?.clientId ?? null,
    clientNombre: initial?.clientNombre ?? "",
    clientCedula: initial?.clientCedula ?? "",
    issueDate: initial?.issueDate?.slice(0, 10) ?? todayInCostaRica(),
    showUnitPrice: initial?.showUnitPrice ?? true,
    discount: initial?.discount ?? 0,
    notes: initial?.notes ?? "",
    items: initial?.items?.length
      ? initial.items.map(({ description, quantity, unitPrice }) => ({
          description,
          quantity,
          unitPrice,
        }))
      : [{ description: "", quantity: 0, unitPrice: 0 }],
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function StepBadge({ step, label }: { step: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-[3px] border border-rc-ink px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-rc-ink">
        {step}
      </span>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rc-gold-dark">
        {label}
      </p>
    </div>
  );
}

export function FacturaForm({ initial }: { initial?: FacturaData }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  // Raw text typed in the "Total" field, so decimals like "12." survive typing.
  const [totalDrafts, setTotalDrafts] = useState<Record<string, string>>({});

  const { register, handleSubmit, control, setValue } = useForm<FacturaInput>({
    resolver: zodResolver(facturaSchema),
    defaultValues: buildDefaultValues(initial),
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "items" });

  const watchedItems = useWatch({ control, name: "items" });
  const watchedDiscount = useWatch({ control, name: "discount" });

  const isEdit = Boolean(initial?.id);
  const previewUrl = isEdit ? `/facturas/${initial?.id}/print-template` : null;

  const subtotal = useMemo(
    () =>
      (watchedItems ?? []).reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [watchedItems]
  );
  const total = Math.max(subtotal - (watchedDiscount || 0), 0);
  const unitsCount = useMemo(
    () => (watchedItems ?? []).reduce((sum, item) => sum + item.quantity, 0),
    [watchedItems]
  );

  function clearTotalDraft(fieldId: string) {
    setTotalDrafts((prev) => {
      if (!(fieldId in prev)) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }

  function removeItem(index: number) {
    const removedId = fields[index]?.id;
    remove(index);
    if (removedId) clearTotalDraft(removedId);
    sileo.success({
      title: "Producto eliminado",
      description: "El item fue removido de la factura.",
      duration: 2200,
    });
  }

  async function saveFactura(values: FacturaInput) {
    setError(null);
    setSaving(true);

    const payload = {
      clientId: values.clientId,
      clientNombre: values.clientNombre,
      clientCedula: values.clientCedula,
      issueDate: values.issueDate,
      showUnitPrice: values.showUnitPrice,
      discount: values.discount || 0,
      notes: values.notes,
      items: values.items,
    };

    const res = await fetch(initial?.id ? `/api/facturas/${initial.id}` : "/api/facturas", {
      method: initial?.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data: { id?: string } | null = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      setError("No se pudo guardar la factura.");
      setSaving(false);
      return;
    }

    if (!initial?.id && data?.id) {
      sileo.success({
        title: "Factura guardada",
        description: "Ya puedes descargar el PDF.",
        duration: 2200,
      });
      router.push(`/facturas/${data.id}/edit`);
      return;
    }

    setLastSavedAt(
      new Date().toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" })
    );
    setPreviewKey((key) => key + 1);
    setSaving(false);
    sileo.success({
      title: "Cambios guardados",
      description: "Los cambios se guardaron correctamente.",
      duration: 2200,
    });
  }

  const onSubmit = handleSubmit(saveFactura, () =>
    setError("Revisa los campos: nombre, fecha y al menos un item completo.")
  );

  return (
    <form className="grid gap-8" onSubmit={onSubmit} noValidate>
      <Card variant="plain">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <StepBadge step="Paso 1" label="Cliente" />
            <h3 className="mt-2 font-serif text-2xl font-semibold text-rc-ink">
              Datos del cliente
            </h3>
            <p className="mt-1.5 text-sm text-rc-ink/70">
              Busca un cliente o completa nombre y cédula manualmente.
            </p>
          </div>
          <Button variant="ghost" size="sm" href="/clientes">
            Nuevo cliente
          </Button>
        </div>

        <div className="mt-5 grid gap-3">
          <ClientAutocomplete
            onSelect={(cliente) => {
              setValue("clientId", cliente.id);
              setValue("clientNombre", cliente.nombre);
              setValue("clientCedula", cliente.cedulaJuridica ?? "");
            }}
          />
          <div className="grid gap-3 md:grid-cols-[2fr,1fr,1fr]">
            <Field label="Nombre" htmlFor="clientNombre">
              <Input
                id="clientNombre"
                placeholder="Nombre del cliente"
                autoComplete="off"
                {...register("clientNombre")}
              />
            </Field>
            <Field label="Cédula" htmlFor="clientCedula">
              <Input
                id="clientCedula"
                placeholder="Cédula (opcional)"
                autoComplete="off"
                {...register("clientCedula")}
              />
            </Field>
            <Field label="Fecha de factura" htmlFor="issueDate">
              <Input id="issueDate" type="date" {...register("issueDate")} />
            </Field>
          </div>
        </div>
      </Card>

      <Card variant="plain">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <StepBadge step="Paso 2" label="Items" />
            <h3 className="mt-2 font-serif text-2xl font-semibold text-rc-ink">
              Detalle de la factura
            </h3>
            <p className="mt-1.5 text-sm text-rc-ink/70">
              Primera línea como título; las siguientes se muestran como viñetas.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-rc-ink/70">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--rc-gold)]"
                {...register("showUnitPrice")}
              />
              Mostrar precio unitario en PDF
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => append({ description: "", quantity: 0, unitPrice: 0 })}
            >
              Agregar item
            </Button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {fields.map((field, index) => {
            const item = watchedItems?.[index] ?? field;
            const lineTotal = round2(item.quantity * item.unitPrice);
            return (
              <Card key={field.id} variant="stat">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-[3px] border border-rc-ink px-2.5 py-1 font-mono text-[10px] font-bold text-rc-ink">
                      Item {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-sm font-semibold text-rc-ink">
                      Total: {formatCRC(lineTotal)}
                    </span>
                  </div>
                  {fields.length > 1 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => move(index, index - 1)}
                        disabled={index === 0}
                        aria-label={`Subir item ${index + 1}`}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => move(index, index + 1)}
                        disabled={index === fields.length - 1}
                        aria-label={`Bajar item ${index + 1}`}
                      >
                        ↓
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => removeItem(index)}>
                        Quitar
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[2fr,1fr,1fr,1fr]">
                  <Field label="Descripción" htmlFor={`item-${field.id}-description`}>
                    <Textarea
                      id={`item-${field.id}-description`}
                      className="min-h-[96px]"
                      placeholder="Descripción (usa líneas nuevas para viñetas)"
                      {...register(`items.${index}.description`)}
                    />
                  </Field>
                  <Field label="Cantidad" htmlFor={`item-${field.id}-quantity`}>
                    <Input
                      id={`item-${field.id}-quantity`}
                      type="text"
                      inputMode="numeric"
                      value={item.quantity === 0 ? "" : item.quantity}
                      onChange={(event) => {
                        const cleaned = event.target.value.replace(/[^\d]/g, "");
                        const nextQuantity = cleaned ? Number(cleaned) : 0;
                        setValue(`items.${index}.quantity`, nextQuantity);
                        const draft = totalDrafts[field.id];
                        if (draft && nextQuantity > 0) {
                          const nextUnit = Number(draft) / nextQuantity;
                          setValue(
                            `items.${index}.unitPrice`,
                            Number.isFinite(nextUnit) ? nextUnit : 0
                          );
                        }
                      }}
                    />
                  </Field>
                  <Field label="Precio unitario" htmlFor={`item-${field.id}-unitPrice`}>
                    <Input
                      id={`item-${field.id}-unitPrice`}
                      type="text"
                      inputMode="decimal"
                      value={item.unitPrice === 0 ? "" : round2(item.unitPrice)}
                      onChange={(event) => {
                        const normalized = event.target.value
                          .replace(",", ".")
                          .replace(/[^\d.]/g, "");
                        setValue(
                          `items.${index}.unitPrice`,
                          normalized ? Number(normalized) : 0
                        );
                        clearTotalDraft(field.id);
                      }}
                    />
                  </Field>
                  <Field label="Total" htmlFor={`item-${field.id}-total`}>
                    <Input
                      id={`item-${field.id}-total`}
                      type="text"
                      inputMode="decimal"
                      value={totalDrafts[field.id] ?? (lineTotal > 0 ? String(lineTotal) : "")}
                      onChange={(event) => {
                        const normalized = event.target.value
                          .replace(",", ".")
                          .replace(/[^\d.]/g, "");
                        setTotalDrafts((prev) => ({ ...prev, [field.id]: normalized }));
                        if (item.quantity > 0) {
                          const nextUnit = (normalized ? Number(normalized) : 0) / item.quantity;
                          setValue(
                            `items.${index}.unitPrice`,
                            Number.isFinite(nextUnit) ? nextUnit : 0
                          );
                        }
                      }}
                    />
                  </Field>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      <Card variant="plain">
        <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
          <div>
            <StepBadge step="Paso 3" label="Notas" />
            <Textarea
              className="mt-3 min-h-[120px]"
              placeholder="Notas de la factura (opcional)."
              aria-label="Notas de la factura"
              {...register("notes")}
            />
          </div>
          <Card variant="stat">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rc-gold-dark">
              Resumen
            </p>
            <div className="mt-2.5 flex items-center justify-between font-mono text-xs text-rc-ink/70">
              <span>{fields.length} items</span>
              <span>{unitsCount} unidades</span>
            </div>
            <div className="my-3 border-t border-dashed border-rc-line" />
            <div className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between text-rc-ink">
                <span>Subtotal</span>
                <span className="font-mono">{formatCRC(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-rc-ink">
                <label htmlFor="discount">Descuento</label>
                <input
                  id="discount"
                  className="w-28 rounded-[3px] border-[1.5px] border-rc-line bg-rc-surface px-2 py-1.5 text-right font-mono text-sm text-rc-ink outline-none transition-shadow focus:border-rc-ink focus:shadow-[2px_2px_0_var(--rc-gold)]"
                  type="number"
                  min={0}
                  step="0.01"
                  {...register("discount", {
                    setValueAs: (value) => (value === "" ? 0 : Number(value)),
                  })}
                />
              </div>
              <div className="flex justify-between text-base font-semibold text-rc-ink">
                <span>Total</span>
                <span className="font-mono">{formatCRC(total)}</span>
              </div>
            </div>
          </Card>
        </div>
        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-[3px] border border-rc-stamp bg-rc-stamp/10 px-4 py-3 text-sm text-rc-stamp"
          >
            {error}
          </p>
        ) : null}
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-mono text-xs uppercase tracking-[0.16em] text-rc-ink/60" aria-live="polite">
          {lastSavedAt ? `Guardado ${lastSavedAt}` : "Sin guardar"}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {initial?.id ? (
            <Button
              variant="ghost"
              href={`/api/facturas/${initial.id}/pdf`}
              target="_blank"
              rel="noreferrer"
            >
              Descargar PDF
            </Button>
          ) : null}
          <Button disabled={saving} type="submit">
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Guardar factura"}
          </Button>
        </div>
      </div>

      <Card variant="plain">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rc-gold-dark">
          Vista previa
        </p>
        <h3 className="mt-1 font-serif text-2xl font-semibold text-rc-ink">PDF en vivo</h3>
        <div className="mt-4">
          {previewUrl ? (
            <iframe
              key={previewKey}
              title="Vista previa de la factura"
              className="h-[720px] w-full rounded-[3px] border border-rc-line bg-white"
              src={previewUrl}
            />
          ) : (
            <div className="rounded-[3px] border border-dashed border-rc-line p-6 text-sm text-rc-ink/60">
              Guarda la factura para ver la vista previa.
            </div>
          )}
        </div>
      </Card>
    </form>
  );
}
