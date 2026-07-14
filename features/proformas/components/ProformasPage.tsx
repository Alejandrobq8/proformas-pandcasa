"use client";

import { useMemo, useState } from "react";
import { formatCRC } from "@/shared/lib/money";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useProformasQuery, useDeleteProforma } from "@/features/proformas/hooks";
import type { ProformaFilters, ProformaRecord } from "@/features/proformas/api";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatCard, Card } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Field, Input, Select } from "@/shared/components/ui/Input";
import { Badge } from "@/shared/components/ui/Badge";

const emptyFilters: ProformaFilters = {
  number: "",
  client: "",
  date: "",
  amountMin: "",
  amountMax: "",
};

const statusLabel: Record<ProformaRecord["status"], string> = {
  DRAFT: "Guardada",
  SENT: "Enviada",
  PAID: "Pagada",
};

const statusTone: Record<
  ProformaRecord["status"],
  "neutral" | "gold" | "success"
> = {
  DRAFT: "neutral",
  SENT: "gold",
  PAID: "success",
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
  const [filters, setFilters] = useState<ProformaFilters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [take, setTake] = useState(20);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => value.trim().length > 0).length,
    [filters]
  );

  const debouncedFilters = useDebouncedValue(filters, 300);
  const { data, isFetching, error } = useProformasQuery(debouncedFilters, take);
  const proformas = data?.data ?? [];
  const total = data?.total ?? 0;

  const deleteProforma = useDeleteProforma();

  function updateFilter(key: keyof ProformaFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setTake(20);
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar proforma?")) return;
    await deleteProforma.mutateAsync(id);
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Proformas"
        title="Proformas"
        description="Consulta, edita y descarga tus proformas."
        aside={
          <>
            <StatCard label="Total" value={total} />
            <StatCard label="Filtros" value={activeFilterCount} />
            <StatCard label="Vista" value="Edicion y PDF en un paso" />
          </>
        }
      />

      <Card variant="plain">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rc-gold-dark">
              Proformas
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-rc-ink">
              {total} documentos
            </h2>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button variant="ghost" onClick={() => setFiltersOpen((prev) => !prev)}>
              Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
            <Button href="/proformas/new">Nueva proforma</Button>
          </div>
        </div>

        {filtersOpen ? (
          <Card variant="stat" className="mt-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Numero" htmlFor="filter-number">
                <Input
                  id="filter-number"
                  placeholder="PF-2026-0001"
                  value={filters.number}
                  onChange={(event) => updateFilter("number", event.target.value)}
                />
              </Field>
              <Field label="Cliente" htmlFor="filter-client">
                <Input
                  id="filter-client"
                  placeholder="Nombre o empresa"
                  value={filters.client}
                  onChange={(event) => updateFilter("client", event.target.value)}
                />
              </Field>
              <Field label="Fecha" htmlFor="filter-date">
                <Input
                  id="filter-date"
                  placeholder="YYYY-MM o YYYY-MM-DD"
                  value={filters.date}
                  onChange={(event) => updateFilter("date", event.target.value)}
                />
              </Field>
              <Field label="Monto desde" htmlFor="filter-amount-min">
                <Input
                  id="filter-amount-min"
                  placeholder="₡ 15000"
                  value={filters.amountMin}
                  onChange={(event) => updateFilter("amountMin", event.target.value)}
                />
              </Field>
              <Field label="Monto hasta" htmlFor="filter-amount-max">
                <Input
                  id="filter-amount-max"
                  placeholder="₡ 45000"
                  value={filters.amountMax}
                  onChange={(event) => updateFilter("amountMax", event.target.value)}
                />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters(emptyFilters);
                  setTake(20);
                }}
              >
                Limpiar filtros
              </Button>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-rc-ink/70">
                Mostrar
                <Select
                  className="w-auto"
                  value={take}
                  onChange={(event) => setTake(Number(event.target.value))}
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Select>
              </label>
            </div>
          </Card>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-[3px] border border-rc-stamp bg-rc-stamp/10 px-4 py-3 text-sm text-rc-stamp">
            {error instanceof Error ? error.message : "No se pudieron cargar las proformas."}
          </p>
        ) : null}

        <div className="mt-6 space-y-3">
          {isFetching ? (
            <p className="text-sm text-rc-ink/60">Cargando...</p>
          ) : proformas.length === 0 ? (
            <p className="text-sm text-rc-ink/60">No hay proformas aun.</p>
          ) : (
            proformas.map((proforma) => (
              <Card
                key={proforma.id}
                variant="plain"
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-xs text-rc-gold-dark">
                      {proforma.number}
                    </p>
                    <Badge tone={statusTone[proforma.status]}>
                      {statusLabel[proforma.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 font-semibold text-rc-ink">
                    {proforma.clientNombre} - {proforma.clientEmpresa}
                  </p>
                  <p className="text-xs text-rc-ink/60">
                    Total {formatCRC(toNumber(proforma.total))}
                  </p>
                </div>
                <div className="flex w-full flex-wrap justify-center gap-2 sm:w-auto sm:justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    href={`/api/proformas/${proforma.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    PDF
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    href={`/proformas/${proforma.id}/edit`}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(proforma.id)}
                    aria-label="Eliminar"
                  >
                    Eliminar
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
        {proformas.length < total ? (
          <div className="mt-6 flex justify-center">
            <Button
              variant="ghost"
              onClick={() => setTake((prev) => prev + 20)}
              disabled={isFetching}
            >
              Cargar más
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
