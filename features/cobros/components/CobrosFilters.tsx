"use client";

import { useState } from "react";
import { Card } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Field, Input, Select } from "@/shared/components/ui/Input";
import type { CobrosFiltersState } from "@/features/cobros/hooks/useCobrosFilters";

export function CobrosFilters({
  filters,
  setField,
  clearFilters,
  filtersActive,
  moreFiltersActive,
}: {
  filters: CobrosFiltersState;
  setField: <K extends keyof CobrosFiltersState>(field: K, value: CobrosFiltersState[K]) => void;
  clearFilters: () => void;
  filtersActive: boolean;
  moreFiltersActive: boolean;
}) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  return (
    <Card variant="plain">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rc-gold-dark">
          Filtros
        </p>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-rc-ink/80">
            <input
              type="checkbox"
              checked={filters.showCancelled}
              onChange={(e) => setField("showCancelled", e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-[var(--rc-stamp)]"
            />
            Mostrar canceladas
          </label>
          {filtersActive ? (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpiar
            </Button>
          ) : null}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="N° proforma" htmlFor="cobro-filter-number">
          <Input
            id="cobro-filter-number"
            placeholder="N° proforma"
            value={filters.number}
            onChange={(e) => setField("number", e.target.value)}
          />
        </Field>
        <Field label="Solicitante" htmlFor="cobro-filter-client">
          <Input
            id="cobro-filter-client"
            placeholder="Solicitante"
            value={filters.client}
            onChange={(e) => setField("client", e.target.value)}
          />
        </Field>
        <Field label="Descripción de entrega" htmlFor="cobro-filter-entrega">
          <Input
            id="cobro-filter-entrega"
            placeholder="Buscar en descripción de entrega"
            value={filters.entrega}
            onChange={(e) => setField("entrega", e.target.value)}
          />
        </Field>
      </div>

      <button
        type="button"
        onClick={() => setShowMoreFilters((prev) => !prev)}
        className="mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-rc-gold-dark transition hover:text-rc-ink"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${showMoreFilters ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
        {showMoreFilters ? "Menos filtros" : "Más filtros"}
        {!showMoreFilters && moreFiltersActive ? (
          <span className="h-1.5 w-1.5 rounded-full bg-rc-gold-dark" />
        ) : null}
      </button>

      {showMoreFilters ? (
        <div className="mt-3 grid gap-3 border-t border-dashed border-rc-line pt-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Monto minimo" htmlFor="cobro-filter-min">
            <Input
              id="cobro-filter-min"
              placeholder="Monto minimo"
              type="number"
              min={0}
              value={filters.amountMin}
              onChange={(e) => setField("amountMin", e.target.value)}
            />
          </Field>
          <Field label="Monto maximo" htmlFor="cobro-filter-max">
            <Input
              id="cobro-filter-max"
              placeholder="Monto maximo"
              type="number"
              min={0}
              value={filters.amountMax}
              onChange={(e) => setField("amountMax", e.target.value)}
            />
          </Field>
          <Field label="N° OC" htmlFor="cobro-filter-oc">
            <Input
              id="cobro-filter-oc"
              placeholder="N° OC"
              value={filters.oc}
              onChange={(e) => setField("oc", e.target.value)}
            />
          </Field>
          <Field label="MIGO" htmlFor="cobro-filter-migo">
            <Input
              id="cobro-filter-migo"
              placeholder="MIGO"
              type="number"
              min={0}
              value={filters.migo}
              onChange={(e) => setField("migo", e.target.value)}
            />
          </Field>
          <Field label="N° factura" htmlFor="cobro-filter-factura">
            <Input
              id="cobro-filter-factura"
              placeholder="N° factura"
              value={filters.factura}
              onChange={(e) => setField("factura", e.target.value)}
            />
          </Field>
          <Field label="Estado de OC" htmlFor="cobro-filter-oc-status">
            <Select
              id="cobro-filter-oc-status"
              value={filters.ocStatus}
              onChange={(e) => setField("ocStatus", e.target.value as "" | "con" | "sin")}
            >
              <option value="">Todas</option>
              <option value="con">Con OC</option>
              <option value="sin">Sin OC</option>
            </Select>
          </Field>
          <Field label="Estado de pago" htmlFor="cobro-filter-pago-status">
            <Select
              id="cobro-filter-pago-status"
              value={filters.pagoStatus}
              onChange={(e) => setField("pagoStatus", e.target.value as "" | "pagada" | "pendiente")}
            >
              <option value="">Todas</option>
              <option value="pagada">Pagadas</option>
              <option value="pendiente">Pendientes</option>
            </Select>
          </Field>
          <Field label="Fecha de pago desde" htmlFor="cobro-filter-pago-desde">
            <Input
              id="cobro-filter-pago-desde"
              type="date"
              value={filters.pagoDesde}
              max={filters.pagoHasta || undefined}
              onChange={(e) => setField("pagoDesde", e.target.value)}
            />
          </Field>
          <Field label="Fecha de pago hasta" htmlFor="cobro-filter-pago-hasta">
            <Input
              id="cobro-filter-pago-hasta"
              type="date"
              value={filters.pagoHasta}
              min={filters.pagoDesde || undefined}
              onChange={(e) => setField("pagoHasta", e.target.value)}
            />
          </Field>
        </div>
      ) : null}
    </Card>
  );
}
