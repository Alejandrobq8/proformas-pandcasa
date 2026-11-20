"use client";

import { useMemo, useState } from "react";
import { formatCRC, toNumber } from "@/shared/lib/money";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useFacturasQuery, useDeleteFactura } from "@/features/facturas/hooks";
import type { FacturaFilters } from "@/features/facturas/api";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatCard, Card } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Field, Input } from "@/shared/components/ui/Input";

const emptyFilters: FacturaFilters = { number: "", client: "", date: "" };

function formatIssueDate(value: string) {
  const [year, month, day] = value.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

export function FacturasPage() {
  const [filters, setFilters] = useState<FacturaFilters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [take, setTake] = useState(20);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => value.trim().length > 0).length,
    [filters]
  );

  const debouncedFilters = useDebouncedValue(filters, 300);
  const { data, isFetching, error } = useFacturasQuery(debouncedFilters, take);
  const facturas = data?.data ?? [];
  const total = data?.total ?? 0;

  const deleteFactura = useDeleteFactura();

  function updateFilter(key: keyof FacturaFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setTake(20);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar factura? Esta acción no se puede deshacer.")) return;
    await deleteFactura.mutateAsync(id);
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Facturas"
        title="Facturas digitales"
        description="Crea, edita y descarga facturas digitales en PDF."
        aside={
          <>
            <StatCard label="Total" value={total} />
            <StatCard label="Filtros" value={activeFilterCount} />
            <StatCard label="Salida" value="PDF listo para enviar" />
          </>
        }
      />

      <Card variant="plain">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rc-gold-dark">
              Facturas
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-rc-ink">
              {total} documentos
            </h2>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button variant="ghost" onClick={() => setFiltersOpen((prev) => !prev)}>
              Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
            <Button href="/facturas/new">Nueva factura</Button>
          </div>
        </div>

        {filtersOpen ? (
          <Card variant="stat" className="mt-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Número" htmlFor="filter-number">
                <Input
                  id="filter-number"
                  placeholder="FD-2026-0001"
                  value={filters.number}
                  onChange={(event) => updateFilter("number", event.target.value)}
                />
              </Field>
              <Field label="Cliente o cédula" htmlFor="filter-client">
                <Input
                  id="filter-client"
                  placeholder="Nombre o cédula"
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
            </div>
            <div className="mt-4">
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
            </div>
          </Card>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-[3px] border border-rc-stamp bg-rc-stamp/10 px-4 py-3 text-sm text-rc-stamp"
          >
            {error instanceof Error ? error.message : "No se pudieron cargar las facturas."}
          </p>
        ) : null}

        <div className="mt-6 space-y-3">
          {isFetching && facturas.length === 0 ? (
            <p className="text-sm text-rc-ink/60">Cargando…</p>
          ) : facturas.length === 0 ? (
            <p className="text-sm text-rc-ink/60">No hay facturas aún.</p>
          ) : (
            facturas.map((factura) => (
              <Card
                key={factura.id}
                variant="plain"
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-mono text-xs text-rc-gold-dark">{factura.number}</p>
                  <p className="mt-1 font-semibold text-rc-ink">
                    {factura.clientNombre}
                    {factura.clientCedula ? ` · ${factura.clientCedula}` : ""}
                  </p>
                  <p className="text-xs text-rc-ink/60">
                    {formatIssueDate(factura.issueDate)} · Total{" "}
                    {formatCRC(toNumber(factura.total))}
                  </p>
                </div>
                <div className="flex w-full flex-wrap justify-center gap-2 sm:w-auto sm:justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    href={`/api/facturas/${factura.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    PDF
                  </Button>
                  <Button variant="ghost" size="sm" href={`/facturas/${factura.id}/edit`}>
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(factura.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
        {facturas.length < total ? (
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
