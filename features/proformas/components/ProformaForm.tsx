"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ClientAutocomplete } from "./ClientAutocomplete";
import { formatCRC } from "@/shared/lib/money";
import { useLocalStorageDraft } from "@/shared/hooks/useLocalStorageDraft";
import { proformaSchema, type ProformaStatus } from "@/features/proformas/schema";
import { Card } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Field, Input, Textarea } from "@/shared/components/ui/Input";
import { sileo } from "sileo";

const proformaFormSchema = proformaSchema.extend({
  totalDrafts: z.record(z.string(), z.string()),
});

type ProformaFormValues = z.infer<typeof proformaFormSchema>;
type Item = ProformaFormValues["items"][number];

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
  items: Item[];
};

function buildDefaultValues(initial?: ProformaData): ProformaFormValues {
  return {
    clientId: initial?.clientId ?? null,
    clientNombre: initial?.clientNombre ?? "",
    clientEmpresa: initial?.clientEmpresa ?? "",
    clientCedulaJuridica: initial?.clientCedulaJuridica ?? "",
    showUnitPrice: initial?.showUnitPrice ?? true,
    status: initial?.status ?? "DRAFT",
    discount: initial?.discount ?? 0,
    notes: initial?.notes ?? "",
    items: initial?.items?.length
      ? initial.items.map(({ description, quantity, unitPrice }) => ({
          description,
          quantity,
          unitPrice,
        }))
      : [{ description: "", quantity: 0, unitPrice: 0 }],
    totalDrafts: {},
  };
}

function formatDraftTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
  }
  return (
    date.toLocaleDateString("es-CR", { day: "numeric", month: "short" }) +
    " " +
    date.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" })
  );
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

export function ProformaForm({ initial }: { initial?: ProformaData }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
  } = useForm<ProformaFormValues>({
    resolver: zodResolver(proformaFormSchema),
    defaultValues: buildDefaultValues(initial),
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = useWatch({ control, name: "items" });
  const watchedDiscount = useWatch({ control, name: "discount" });
  const watchedTotalDrafts = useWatch({ control, name: "totalDrafts" });

  const isEdit = Boolean(initial?.id);

  const subtotal = useMemo(
    () =>
      (watchedItems ?? []).reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      ),
    [watchedItems]
  );
  const total = subtotal - (watchedDiscount || 0);
  const itemsCount = fields.length;
  const unitsCount = useMemo(
    () => (watchedItems ?? []).reduce((sum, item) => sum + item.quantity, 0),
    [watchedItems]
  );

  const draftKey = initial?.id
    ? `proforma_draft_edit_${initial.id}`
    : "proforma_draft_new";
  const { draft, hasDraft, draftSavedAt, saveDraft, clearDraft } =
    useLocalStorageDraft<ProformaFormValues>(draftKey);
  const draftApplied = useRef(false);

  // Apply recovered draft to the form once after it loads from localStorage
  useEffect(() => {
    if (!hasDraft || !draft || draftApplied.current) return;
    draftApplied.current = true;
    reset(draft);
  }, [hasDraft, draft, reset]);

  // Auto-save form state to localStorage (debounced 800ms)
  useEffect(() => {
    const values = watchedItems;
    const current = getValues();
    const hasContent =
      isEdit ||
      current.clientNombre !== "" ||
      current.clientEmpresa !== "" ||
      current.notes !== "" ||
      (values ?? []).some(
        (item) => item.description !== "" || item.quantity > 0 || item.unitPrice > 0
      );
    if (!hasContent) return;
    const timer = setTimeout(() => {
      saveDraft(getValues());
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedItems, watchedDiscount, watchedTotalDrafts, isEdit, saveDraft]);

  const discardDraft = useCallback(() => {
    clearDraft();
    reset(buildDefaultValues(initial));
  }, [clearDraft, initial, reset]);

  const previewUrl = isEdit
    ? `/proformas/${initial?.id}/print-template`
    : null;
  const submitLabel = isEdit ? "Guardar cambios" : "Guardar proforma";

  function addItem() {
    append({ description: "", quantity: 0, unitPrice: 0 });
  }

  function moveItem(index: number, direction: "up" | "down") {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= fields.length) return;
    move(index, nextIndex);
  }

  function removeItem(index: number) {
    const removedId = fields[index]?.id;
    remove(index);
    if (removedId) {
      const current = getValues("totalDrafts");
      if (current[removedId]) {
        const next = { ...current };
        delete next[removedId];
        setValue("totalDrafts", next);
      }
    }
    sileo.success({
      title: "Producto eliminado",
      description: "El item fue removido de la proforma.",
      duration: 2200,
    });
  }

  async function saveProforma(
    nextStatus: ProformaStatus | undefined,
    values: ProformaFormValues
  ) {
    setError(null);
    setSaving(true);

    const payload = {
      clientId: values.clientId,
      clientNombre: values.clientNombre,
      clientEmpresa: values.clientEmpresa,
      clientCedulaJuridica: values.clientCedulaJuridica,
      showUnitPrice: values.showUnitPrice,
      discount: values.discount || 0,
      notes: values.notes,
      items: values.items,
      status: nextStatus ?? values.status,
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
      clearDraft();
      sileo.success({
        title: nextStatus === "DRAFT" ? "Borrador guardado" : "Proforma guardada",
        description:
          nextStatus === "DRAFT"
            ? "El borrador se guardo correctamente."
            : "Se guardo correctamente.",
        duration: 2200,
      });
      router.push(`/proformas/${createdId}/edit`);
      return;
    }

    clearDraft();
    setValue("status", nextStatus ?? values.status);
    setLastSavedAt(
      new Date().toLocaleTimeString("es-CR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
    setPreviewKey(Date.now());
    setSaving(false);
    sileo.success({
      title: nextStatus === "DRAFT" ? "Borrador guardado" : "Cambios guardados",
      description: "Los cambios se guardaron correctamente.",
      duration: 2200,
    });
  }

  const onSubmit = handleSubmit((values) => saveProforma(undefined, values));

  return (
    <form className="grid gap-8" onSubmit={onSubmit}>
      {hasDraft && draftSavedAt ? (
        <Card variant="stat" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-rc-ink/80">
            Borrador local recuperado — guardado el{" "}
            <span className="font-semibold text-rc-ink">
              {formatDraftTime(draftSavedAt)}
            </span>
          </p>
          <Button variant="ghost" size="sm" onClick={discardDraft}>
            Descartar borrador
          </Button>
        </Card>
      ) : null}

      <Card variant="plain">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <StepBadge step="Paso 1" label="Cliente" />
            <h3 className="mt-2 font-serif text-2xl font-semibold text-rc-ink">
              Seleccion y datos
            </h3>
            <p className="mt-1.5 text-sm text-rc-ink/70">
              Busca un cliente o completa los datos manualmente.
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
              setValue("clientEmpresa", cliente.empresa ?? "");
              setValue("clientCedulaJuridica", cliente.cedulaJuridica ?? "");
            }}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Nombre" {...register("clientNombre")} />
            <Input placeholder="Empresa" {...register("clientEmpresa")} />
          </div>
          <Input
            placeholder="Cedula juridica (opcional)"
            {...register("clientCedulaJuridica")}
          />
        </div>
      </Card>

      <Card variant="plain">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <StepBadge step="Paso 2" label="Items" />
            <h3 className="mt-2 font-serif text-2xl font-semibold text-rc-ink">
              Detalle de la proforma
            </h3>
            <p className="mt-1.5 text-sm text-rc-ink/70">
              Usa varias lineas para describir cada item con vinetas.
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
            <Button variant="ghost" size="sm" onClick={addItem}>
              Agregar item
            </Button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {fields.map((field, index) => {
            const item = watchedItems?.[index] ?? field;
            return (
              <Card key={field.id} variant="stat">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-[3px] border border-rc-ink px-2.5 py-1 font-mono text-[10px] font-bold text-rc-ink">
                      Item {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-sm font-semibold text-rc-ink">
                      Total: {formatCRC(item.quantity * item.unitPrice)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {fields.length > 1 ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveItem(index, "up")}
                          disabled={index === 0}
                          aria-label={`Subir item ${index + 1}`}
                          title="Subir"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M12 19V5" />
                            <path d="m5 12 7-7 7 7" />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveItem(index, "down")}
                          disabled={index === fields.length - 1}
                          aria-label={`Bajar item ${index + 1}`}
                          title="Bajar"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M12 5v14" />
                            <path d="m19 12-7 7-7-7" />
                          </svg>
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => removeItem(index)}>
                          Quitar
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[2fr,1fr,1fr,1fr]">
                  <Field
                    label="Descripción"
                    htmlFor={`item-${field.id}-description`}
                    hint="Primera linea como titulo, el resto como lista."
                  >
                    <Textarea
                      id={`item-${field.id}-description`}
                      className="min-h-[96px]"
                      placeholder="Descripcion (usa lineas nuevas para vinetas)"
                      required
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
                        const draftTotal = getValues("totalDrafts")[field.id];
                        if (draftTotal && nextQuantity > 0) {
                          const totalValue = Number(draftTotal);
                          const nextUnit = totalValue / nextQuantity;
                          setValue(`items.${index}.quantity`, nextQuantity);
                          setValue(
                            `items.${index}.unitPrice`,
                            Number.isFinite(nextUnit) ? nextUnit : 0
                          );
                        } else {
                          setValue(`items.${index}.quantity`, nextQuantity);
                        }
                      }}
                      required
                    />
                  </Field>
                  <Field label="Precio unitario" htmlFor={`item-${field.id}-unitPrice`}>
                    <Input
                      id={`item-${field.id}-unitPrice`}
                      type="text"
                      inputMode="decimal"
                      value={item.unitPrice === 0 ? "" : item.unitPrice}
                      onChange={(event) => {
                        const normalized = event.target.value
                          .replace(",", ".")
                          .replace(/[^\d.]/g, "");
                        setValue(
                          `items.${index}.unitPrice`,
                          normalized ? Number(normalized) : 0
                        );
                        const current = getValues("totalDrafts");
                        if (current[field.id]) {
                          const next = { ...current };
                          delete next[field.id];
                          setValue("totalDrafts", next);
                        }
                      }}
                      required
                    />
                  </Field>
                  <Field label="Total" htmlFor={`item-${field.id}-total`}>
                    <Input
                      id={`item-${field.id}-total`}
                      type="text"
                      inputMode="decimal"
                      value={
                        watchedTotalDrafts?.[field.id] ??
                        (item.quantity > 0 && item.unitPrice > 0
                          ? String(item.quantity * item.unitPrice)
                          : "")
                      }
                      onChange={(event) => {
                        const normalized = event.target.value
                          .replace(",", ".")
                          .replace(/[^\d.]/g, "");
                        const totalValue = normalized ? Number(normalized) : 0;
                        setValue("totalDrafts", {
                          ...getValues("totalDrafts"),
                          [field.id]: normalized,
                        });
                        if (item.quantity > 0) {
                          const nextUnit = totalValue / item.quantity;
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
            <StepBadge step="Paso 3" label="Entrega" />
            <Textarea
              className="mt-3 min-h-[120px]"
              placeholder="Detalles de la entrega."
              {...register("notes")}
            />
          </div>
          <Card variant="stat">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rc-gold-dark">
              Resumen
            </p>
            <div className="mt-2.5 flex items-center justify-between font-mono text-xs text-rc-ink/70">
              <span>{itemsCount} items</span>
              <span>{unitsCount} unidades</span>
            </div>
            <div className="my-3 border-t border-dashed border-rc-line" />
            <div className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between text-rc-ink">
                <span>Subtotal</span>
                <span className="font-mono">{formatCRC(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-rc-ink">
                <span>Descuento</span>
                <input
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
          <p className="mt-4 rounded-[3px] border border-rc-stamp bg-rc-stamp/10 px-4 py-3 text-sm text-rc-stamp">
            {error}
          </p>
        ) : null}
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-mono text-xs uppercase tracking-[0.16em] text-rc-ink/60">
          {lastSavedAt ? `Guardado ${lastSavedAt}` : "Sin guardar"}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="ghost"
            disabled={saving}
            onClick={() => saveProforma("DRAFT", getValues())}
          >
            Guardar borrador
          </Button>
          {initial?.id ? (
            <Button
              variant="ghost"
              onClick={() => window.open(`/api/proformas/${initial.id}/pdf`, "_blank")}
            >
              Descargar PDF
            </Button>
          ) : null}
          {previewUrl ? (
            <Button variant="ghost" onClick={() => window.open(previewUrl, "_blank")}>
              Abrir vista previa
            </Button>
          ) : null}
          <Button disabled={saving} type="submit">
            {saving ? "Guardando..." : submitLabel}
          </Button>
        </div>
      </div>

      <Card variant="plain">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rc-gold-dark">
              Vista previa
            </p>
            <h3 className="mt-1 font-serif text-2xl font-semibold text-rc-ink">
              PDF en vivo
            </h3>
          </div>
          <Button
            variant="ghost"
            onClick={() => saveProforma(undefined, getValues())}
            disabled={saving}
          >
            Actualizar vista previa
          </Button>
        </div>
        <div className="mt-4">
          {previewUrl ? (
            <iframe
              key={previewKey}
              title="Vista previa PDF"
              className="h-[720px] w-full rounded-[3px] border border-rc-line bg-white"
              src={previewUrl}
            />
          ) : (
            <div className="rounded-[3px] border border-dashed border-rc-line p-6 text-sm text-rc-ink/60">
              Guarda la proforma para ver la vista previa.
            </div>
          )}
        </div>
      </Card>
    </form>
  );
}
