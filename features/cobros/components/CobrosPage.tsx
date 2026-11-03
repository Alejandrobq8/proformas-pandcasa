"use client";

import { useMemo } from "react";
import { formatCRC } from "@/shared/lib/money";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Card, StatCard } from "@/shared/components/ui/Card";
import { useCobrosFilters } from "@/features/cobros/hooks/useCobrosFilters";
import { useCobrosData } from "@/features/cobros/hooks/useCobrosData";
import { CobrosFilters } from "@/features/cobros/components/CobrosFilters";
import { CobrosTable } from "@/features/cobros/components/CobrosTable";

export function CobrosPage() {
  const { filters, setField, clearFilters, filtersActive, moreFiltersActive, buildParams } =
    useCobrosFilters();
  const { proformas, setProformas, loading, error } = useCobrosData(buildParams);

  const totalGeneral = useMemo(
    () => proformas.reduce((sum, p) => sum + Number(p.total), 0),
    [proformas]
  );
  const totalCancelado = useMemo(
    () => proformas.filter((p) => p.cancelado).reduce((sum, p) => sum + Number(p.total), 0),
    [proformas]
  );
  const cancelledCount = useMemo(() => proformas.filter((p) => p.cancelado).length, [proformas]);
  const saldoRestante = totalGeneral - totalCancelado;
  const totalPorCobrar = useMemo(
    () =>
      proformas
        .filter((p) => !p.cancelado && !p.verificacionPago && !p.sinpeTransf)
        .reduce((sum, p) => sum + Number(p.total), 0),
    [proformas]
  );
  const porCobrarCount = useMemo(
    () => proformas.filter((p) => !p.cancelado && !p.verificacionPago && !p.sinpeTransf).length,
    [proformas]
  );

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Cobros"
        title="Cobros"
        description="Seguimiento de pagos y facturacion por mes."
      />

      <CobrosFilters
        filters={filters}
        setField={setField}
        clearFilters={clearFilters}
        filtersActive={filtersActive}
        moreFiltersActive={moreFiltersActive}
      />

      {!loading ? (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-rc-ink/60">
          {proformas.length} proforma{proformas.length !== 1 ? "s" : ""}{" "}
          {filtersActive ? "encontrada" + (proformas.length !== 1 ? "s" : "") : "en total"}
        </p>
      ) : null}

      {!loading && proformas.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total general" value={formatCRC(totalGeneral)} />
          <Card variant="stat">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rc-gold-dark">
              Por cobrar
            </p>
            <p className="mt-1.5 font-serif text-2xl text-rc-gold-dark">
              {formatCRC(totalPorCobrar)}
            </p>
            <p className="mt-1 text-xs text-rc-ink/60">
              {porCobrarCount} pendiente{porCobrarCount !== 1 ? "s" : ""}
            </p>
          </Card>
          <Card variant="stat" className="border-rc-stamp">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rc-stamp">
              Total canceladas
            </p>
            <p className="mt-1.5 font-serif text-2xl text-rc-stamp">
              {formatCRC(totalCancelado)}
            </p>
            <p className="mt-1 text-xs text-rc-ink/60">
              {cancelledCount} cancelada{cancelledCount !== 1 ? "s" : ""}
            </p>
          </Card>
          <Card variant="stat" className="border-[#4a6b46]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a6b46]">
              Saldo restante
            </p>
            <p className="mt-1.5 font-serif text-2xl text-[#4a6b46]">
              {formatCRC(saldoRestante)}
            </p>
            <p className="mt-1 text-xs text-rc-ink/60">descontando canceladas</p>
          </Card>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-[3px] border border-rc-stamp bg-rc-stamp/10 px-4 py-3 text-sm text-rc-stamp">
          {error}
        </p>
      ) : null}

      <CobrosTable
        proformas={proformas}
        setProformas={setProformas}
        loading={loading}
        filtersActive={filtersActive}
      />
    </div>
  );
}
