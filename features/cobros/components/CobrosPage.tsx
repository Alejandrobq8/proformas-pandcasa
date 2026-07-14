"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { formatCRC } from "@/shared/lib/money";
import { sileo } from "sileo";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Card, StatCard } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Field, Input } from "@/shared/components/ui/Input";
import { Badge } from "@/shared/components/ui/Badge";

function TableScroller({ children }: { children: React.ReactNode }) {
  const tableWrapRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const phantomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tableWrap = tableWrapRef.current;
    const topBar = topBarRef.current;
    const phantom = phantomRef.current;
    if (!tableWrap || !topBar || !phantom) return;

    const syncPhantomWidth = () => {
      phantom.style.width = `${tableWrap.scrollWidth}px`;
    };
    syncPhantomWidth();

    let fromTop = false;
    let fromTable = false;

    const onTopScroll = () => {
      if (fromTable) return;
      fromTop = true;
      tableWrap.scrollLeft = topBar.scrollLeft;
      fromTop = false;
    };

    const onTableScroll = () => {
      if (fromTop) return;
      fromTable = true;
      topBar.scrollLeft = tableWrap.scrollLeft;
      fromTable = false;
    };

    topBar.addEventListener("scroll", onTopScroll);
    tableWrap.addEventListener("scroll", onTableScroll);

    const ro = new ResizeObserver(syncPhantomWidth);
    ro.observe(tableWrap);

    return () => {
      topBar.removeEventListener("scroll", onTopScroll);
      tableWrap.removeEventListener("scroll", onTableScroll);
      ro.disconnect();
    };
  }, []);

  return (
    <>
      <div
        ref={topBarRef}
        className="overflow-x-scroll overflow-y-hidden border-b border-rc-line"
        style={{ height: 12 }}
      >
        <div ref={phantomRef} style={{ height: 1 }} />
      </div>
      <div ref={tableWrapRef} className="overflow-x-auto">
        {children}
      </div>
    </>
  );
}

type Proforma = {
  id: string;
  number: string;
  createdAt: string;
  total: string | number;
  notes: string | null;
  clientNombre: string;
  clientEmpresa: string | null;
  ordenCompra: string | null;
  migo: string | null;
  numeroFactura: string | null;
  fechaPago: string | null;
  verificacionPago: boolean;
  sinpeTransf: boolean;
  cancelado: boolean;
};

type EditState = { id: string; field: string } | null;

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(key: string) {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  const label = d.toLocaleDateString("es-CR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDateShort(dateStr: string | null) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

function toInputDate(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

function EditableCell({
  isActive,
  isSaving,
  displayValue,
  inputValue,
  inputType = "text",
  placeholder = "—",
  onActivate,
  onCommit,
  onCancel,
  onChange,
}: {
  isActive: boolean;
  isSaving: boolean;
  displayValue: string;
  inputValue: string;
  inputType?: "text" | "number" | "date";
  placeholder?: string;
  onActivate: () => void;
  onCommit: () => void;
  onCancel: () => void;
  onChange: (v: string) => void;
}) {
  if (isActive) {
    return (
      <input
        autoFocus
        type={inputType}
        value={inputValue}
        className="w-full min-w-[90px] rounded-[3px] border-[1.5px] border-rc-ink bg-rc-surface px-2 py-1 text-sm text-rc-ink outline-none"
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit();
          if (e.key === "Escape") onCancel();
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onActivate}
      title="Click para editar"
      className={`min-w-[90px] w-full rounded-[3px] px-2 py-1 text-left text-sm text-rc-ink transition hover:bg-rc-kraft ${
        isSaving ? "opacity-50 cursor-wait" : "cursor-text"
      }`}
    >
      {displayValue ? (
        displayValue
      ) : (
        <span className="text-rc-ink/40 select-none">{placeholder}</span>
      )}
    </button>
  );
}

export function CobrosPage() {
  const [filterNumber, setFilterNumber] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterAmountMin, setFilterAmountMin] = useState("");
  const [filterAmountMax, setFilterAmountMax] = useState("");
  const [filterMigo, setFilterMigo] = useState("");
  const [filterOC, setFilterOC] = useState("");
  const [filterFactura, setFilterFactura] = useState("");

  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const currentMonthKey = getCurrentMonthKey();
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [monthsInitialized, setMonthsInitialized] = useState(false);

  const [editing, setEditing] = useState<EditState>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState<Set<string>>(new Set());

  const fetchProformas = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ take: "9999", skip: "0" });
    if (filterNumber) params.set("number", filterNumber);
    if (filterClient) params.set("client", filterClient);
    if (filterAmountMin) params.set("amountMin", filterAmountMin);
    if (filterAmountMax) params.set("amountMax", filterAmountMax);
    if (filterMigo) params.set("migo", filterMigo);
    if (filterOC) params.set("oc", filterOC);
    if (filterFactura) params.set("factura", filterFactura);
    try {
      const res = await fetch(`/api/proformas?${params}`);
      if (!res.ok) throw new Error("error");
      const json = await res.json();
      setProformas(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      setError("No se pudieron cargar las proformas.");
    } finally {
      setLoading(false);
    }
  }, [filterNumber, filterClient, filterAmountMin, filterAmountMax, filterMigo, filterOC, filterFactura]);

  useEffect(() => {
    const timer = setTimeout(fetchProformas, 300);
    return () => clearTimeout(timer);
  }, [fetchProformas]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Proforma[]>();
    for (const p of proformas) {
      const key = getMonthKey(p.createdAt);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => ({ key, label: formatMonthLabel(key), items: [...items].reverse() }));
  }, [proformas]);

  useEffect(() => {
    if (!monthsInitialized && grouped.length > 0) {
      const initial = new Set<string>();
      for (const g of grouped) {
        if (g.key !== currentMonthKey) initial.add(g.key);
      }
      setCollapsedMonths(initial);
      setMonthsInitialized(true);
    }
  }, [grouped, currentMonthKey, monthsInitialized]);

  function toggleMonth(key: string) {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function startEdit(id: string, field: string, value: string) {
    setEditing({ id, field });
    setEditValue(value);
  }

  async function commitEdit(id: string, field: string) {
    if (editing?.id !== id || editing?.field !== field) return;
    setEditing(null);

    const proforma = proformas.find((p) => p.id === id);
    if (!proforma) return;

    const nextValue: string | null = editValue.trim() || null;

    const original = proforma[field as keyof Proforma];
    const originalStr = original === null || original === undefined ? "" : String(original);
    const newStr = nextValue ?? "";
    if (newStr === originalStr) return;

    const key = `${id}:${field}`;
    setSaving((prev) => new Set(prev).add(key));

    try {
      const res = await fetch(`/api/proformas/${id}/cobro`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextValue }),
      });
      if (!res.ok) throw new Error("error");
      const updated = await res.json();
      setProformas((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
    } catch {
      sileo.error({
        title: "Error al guardar",
        description: "No se pudo guardar el cambio.",
        duration: 2500,
      });
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  async function toggleBoolean(id: string, field: "verificacionPago" | "sinpeTransf" | "cancelado", current: boolean) {
    setProformas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: !current } : p))
    );
    try {
      const res = await fetch(`/api/proformas/${id}/cobro`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !current }),
      });
      if (!res.ok) throw new Error("error");
    } catch {
      setProformas((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: current } : p))
      );
      sileo.error({
        title: "Error al guardar",
        description: "No se pudo actualizar el campo.",
        duration: 2500,
      });
    }
  }

  function clearFilters() {
    setFilterNumber("");
    setFilterClient("");
    setFilterAmountMin("");
    setFilterAmountMax("");
    setFilterMigo("");
    setFilterOC("");
    setFilterFactura("");
  }

  const filtersActive =
    filterNumber || filterClient || filterAmountMin || filterAmountMax || filterMigo || filterOC || filterFactura;

  const totalGeneral = useMemo(
    () => proformas.reduce((sum, p) => sum + Number(p.total), 0),
    [proformas]
  );
  const totalCancelado = useMemo(
    () => proformas.filter((p) => p.cancelado).reduce((sum, p) => sum + Number(p.total), 0),
    [proformas]
  );
  const cancelledCount = useMemo(
    () => proformas.filter((p) => p.cancelado).length,
    [proformas]
  );
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

  const columns = [
    "N° Proforma",
    "Fecha",
    "Monto Total",
    "Descripción Entrega",
    "Solicitante",
    "Orden de Compra",
    "MIGO",
    "N° Factura",
    "Fecha de Pago",
    "Verificado",
    "SINPE/TRANSF.",
    "Cancelado",
  ];

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Cobros"
        title="Cobros"
        description="Seguimiento de pagos y facturacion por mes."
      />

      <Card variant="plain">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rc-gold-dark">
            Filtros
          </p>
          {filtersActive ? (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpiar
            </Button>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          <Field label="N° proforma" htmlFor="cobro-filter-number">
            <Input
              id="cobro-filter-number"
              placeholder="N° proforma"
              value={filterNumber}
              onChange={(e) => setFilterNumber(e.target.value)}
            />
          </Field>
          <Field label="Solicitante" htmlFor="cobro-filter-client">
            <Input
              id="cobro-filter-client"
              placeholder="Solicitante"
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
            />
          </Field>
          <Field label="Monto minimo" htmlFor="cobro-filter-min">
            <Input
              id="cobro-filter-min"
              placeholder="Monto minimo"
              type="number"
              min={0}
              value={filterAmountMin}
              onChange={(e) => setFilterAmountMin(e.target.value)}
            />
          </Field>
          <Field label="Monto maximo" htmlFor="cobro-filter-max">
            <Input
              id="cobro-filter-max"
              placeholder="Monto maximo"
              type="number"
              min={0}
              value={filterAmountMax}
              onChange={(e) => setFilterAmountMax(e.target.value)}
            />
          </Field>
          <Field label="MIGO" htmlFor="cobro-filter-migo">
            <Input
              id="cobro-filter-migo"
              placeholder="MIGO"
              type="number"
              min={0}
              value={filterMigo}
              onChange={(e) => setFilterMigo(e.target.value)}
            />
          </Field>
          <Field label="N° OC" htmlFor="cobro-filter-oc">
            <Input
              id="cobro-filter-oc"
              placeholder="N° OC"
              value={filterOC}
              onChange={(e) => setFilterOC(e.target.value)}
            />
          </Field>
          <Field label="N° factura" htmlFor="cobro-filter-factura">
            <Input
              id="cobro-filter-factura"
              placeholder="N° factura"
              value={filterFactura}
              onChange={(e) => setFilterFactura(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {!loading ? (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-rc-ink/60">
          {total} proforma{total !== 1 ? "s" : ""}{" "}
          {filtersActive ? "encontrada" + (total !== 1 ? "s" : "") : "en total"}
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

      {loading ? (
        <Card variant="plain" className="py-12 text-center text-sm text-rc-ink/60">
          Cargando...
        </Card>
      ) : grouped.length === 0 ? (
        <div className="rounded-[2px] border border-dashed border-rc-line bg-rc-surface px-6 py-12 text-center">
          <p className="text-sm text-rc-ink/60">
            {filtersActive
              ? "No se encontraron proformas con esos filtros."
              : "Aún no hay proformas registradas."}
          </p>
        </div>
      ) : (
        grouped.map((group) => {
          const isCollapsed = collapsedMonths.has(group.key);
          const cancelled = group.items.filter((p) => p.cancelado).length;
          const paid = group.items.filter((p) => (p.verificacionPago || p.sinpeTransf) && !p.cancelado).length;
          const pending = group.items.length - paid - cancelled;
          const groupTotal = group.items.reduce((sum, p) => sum + Number(p.total), 0);
          const groupCancelledTotal = group.items.filter((p) => p.cancelado).reduce((sum, p) => sum + Number(p.total), 0);
          const groupSaldo = groupTotal - groupCancelledTotal;
          const groupPorCobrar = group.items
            .filter((p) => !p.cancelado && !p.verificacionPago && !p.sinpeTransf)
            .reduce((sum, p) => sum + Number(p.total), 0);
          const groupPorCobrarCount = group.items.filter(
            (p) => !p.cancelado && !p.verificacionPago && !p.sinpeTransf
          ).length;

          return (
            <section
              key={group.key}
              className="overflow-hidden rounded-[2px] border border-rc-ink bg-rc-surface"
            >
              <button
                type="button"
                onClick={() => toggleMonth(group.key)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-rc-kraft"
              >
                <div className="flex items-center gap-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-rc-ink/60 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  <h2 className="font-serif text-xl font-semibold text-rc-ink">
                    {group.label}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="hidden font-mono uppercase tracking-[0.14em] text-rc-ink/60 sm:block">
                    {group.items.length} proforma{group.items.length !== 1 ? "s" : ""}
                  </span>
                  {paid > 0 ? (
                    <Badge tone="success">
                      {paid} pagada{paid !== 1 ? "s" : ""}
                    </Badge>
                  ) : null}
                  {pending > 0 ? (
                    <Badge tone="gold">
                      {pending} pendiente{pending !== 1 ? "s" : ""}
                    </Badge>
                  ) : null}
                  {cancelled > 0 ? (
                    <Badge tone="danger">
                      {cancelled} cancelada{cancelled !== 1 ? "s" : ""}
                    </Badge>
                  ) : null}
                </div>
              </button>

              {!isCollapsed ? (
                <div className="border-t border-rc-line">
                  <TableScroller>
                    <table className="w-full min-w-[900px] text-sm">
                      <thead>
                        <tr className="border-b-2 border-rc-ink bg-rc-kraft">
                          {columns.map((col) => (
                            <th
                              key={col}
                              className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-rc-gold-dark"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((p, index) => {
                          const isVerified = p.verificacionPago;
                          const isPaid = (isVerified || p.sinpeTransf) && !p.cancelado;
                          return (
                            <tr
                              key={p.id}
                              className={`border-b border-rc-line last:border-0 transition-colors ${
                                p.cancelado
                                  ? "bg-rc-stamp/10 opacity-70"
                                  : isPaid
                                  ? "bg-[#4a6b46]/10"
                                  : index % 2 === 1
                                  ? "bg-rc-kraft/30"
                                  : ""
                              }`}
                            >
                              <td className="whitespace-nowrap px-3 py-2">
                                <a
                                  href={`/api/proformas/${p.id}/pdf`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono font-semibold text-rc-ink transition hover:text-rc-gold-dark hover:underline"
                                >
                                  {p.number}
                                </a>
                              </td>

                              <td className="whitespace-nowrap px-3 py-2 text-rc-ink/70">
                                {formatDateShort(p.createdAt)}
                              </td>

                              <td className="whitespace-nowrap px-3 py-2 font-mono font-semibold text-rc-ink">
                                {formatCRC(Number(p.total))}
                              </td>

                              <td className="max-w-[200px] px-3 py-2">
                                {p.notes ? (
                                  <span className="block truncate text-rc-ink/70" title={p.notes}>
                                    {p.notes}
                                  </span>
                                ) : (
                                  <span className="text-rc-ink/30">—</span>
                                )}
                              </td>

                              <td className="whitespace-nowrap px-3 py-2">
                                <span className="font-medium text-rc-ink">{p.clientNombre}</span>
                                {p.clientEmpresa ? (
                                  <span className="block text-xs text-rc-ink/60">
                                    {p.clientEmpresa}
                                  </span>
                                ) : null}
                              </td>

                              <td className="px-3 py-2">
                                <EditableCell
                                  isActive={editing?.id === p.id && editing?.field === "ordenCompra"}
                                  isSaving={saving.has(`${p.id}:ordenCompra`)}
                                  displayValue={p.ordenCompra ?? ""}
                                  inputValue={editValue}
                                  onActivate={() => startEdit(p.id, "ordenCompra", p.ordenCompra ?? "")}
                                  onCommit={() => commitEdit(p.id, "ordenCompra")}
                                  onCancel={() => setEditing(null)}
                                  onChange={setEditValue}
                                />
                              </td>

                              <td className="px-3 py-2">
                                <EditableCell
                                  isActive={editing?.id === p.id && editing?.field === "migo"}
                                  isSaving={saving.has(`${p.id}:migo`)}
                                  displayValue={p.migo !== null ? String(p.migo) : ""}
                                  inputValue={editValue}
                                  onActivate={() => startEdit(p.id, "migo", p.migo !== null ? String(p.migo) : "")}
                                  onCommit={() => commitEdit(p.id, "migo")}
                                  onCancel={() => setEditing(null)}
                                  onChange={setEditValue}
                                />
                              </td>

                              <td className="px-3 py-2">
                                <EditableCell
                                  isActive={editing?.id === p.id && editing?.field === "numeroFactura"}
                                  isSaving={saving.has(`${p.id}:numeroFactura`)}
                                  displayValue={p.numeroFactura ?? ""}
                                  inputValue={editValue}
                                  onActivate={() => startEdit(p.id, "numeroFactura", p.numeroFactura ?? "")}
                                  onCommit={() => commitEdit(p.id, "numeroFactura")}
                                  onCancel={() => setEditing(null)}
                                  onChange={setEditValue}
                                />
                              </td>

                              <td className="px-3 py-2">
                                <EditableCell
                                  isActive={editing?.id === p.id && editing?.field === "fechaPago"}
                                  isSaving={saving.has(`${p.id}:fechaPago`)}
                                  displayValue={formatDateShort(p.fechaPago)}
                                  inputValue={editValue}
                                  inputType="date"
                                  onActivate={() => startEdit(p.id, "fechaPago", toInputDate(p.fechaPago))}
                                  onCommit={() => commitEdit(p.id, "fechaPago")}
                                  onCancel={() => setEditing(null)}
                                  onChange={setEditValue}
                                />
                              </td>

                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={isVerified}
                                  onChange={() => toggleBoolean(p.id, "verificacionPago", isVerified)}
                                  className="h-4 w-4 cursor-pointer accent-[#4a6b46]"
                                  title={isVerified ? "Pago verificado" : "Marcar como verificado"}
                                />
                              </td>

                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={p.sinpeTransf}
                                  onChange={() => toggleBoolean(p.id, "sinpeTransf", p.sinpeTransf)}
                                  className="h-4 w-4 cursor-pointer accent-[var(--rc-gold)]"
                                  title={p.sinpeTransf ? "SINPE/Transferencia confirmada" : "Marcar como SINPE/Transferencia"}
                                />
                              </td>

                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={p.cancelado}
                                  onChange={() => toggleBoolean(p.id, "cancelado", p.cancelado)}
                                  className="h-4 w-4 cursor-pointer accent-[var(--rc-stamp)]"
                                  title={p.cancelado ? "Pedido cancelado" : "Marcar como cancelado"}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-rc-ink bg-rc-kraft">
                          <td colSpan={2} className="px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-rc-gold-dark">
                            Total pagado
                          </td>
                          <td className="px-3 py-2.5 font-mono font-semibold text-[#4a6b46]">
                            {formatCRC(
                              group.items
                                .filter((p) => (p.verificacionPago || p.sinpeTransf) && !p.cancelado)
                                .reduce((sum, p) => sum + Number(p.total), 0)
                            )}
                          </td>
                          <td colSpan={9} className="px-3 py-2.5 text-xs text-rc-ink/60">
                            {paid} de {group.items.length} proforma{group.items.length !== 1 ? "s" : ""} pagada{paid !== 1 ? "s" : ""}
                            {cancelled > 0 && ` · ${cancelled} cancelada${cancelled !== 1 ? "s" : ""}`}
                          </td>
                        </tr>
                        <tr className="border-t border-rc-line bg-rc-kraft">
                          <td colSpan={2} className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rc-gold-dark">
                            Total del mes
                          </td>
                          <td className="px-3 py-2 font-mono font-semibold text-rc-ink">
                            {formatCRC(groupTotal)}
                          </td>
                          <td colSpan={9} className="px-3 py-2 text-xs text-rc-ink/60">
                            {group.items.length} proforma{group.items.length !== 1 ? "s" : ""}
                          </td>
                        </tr>
                        {groupPorCobrarCount > 0 ? (
                          <tr className="border-t border-rc-line bg-rc-kraft/60">
                            <td colSpan={2} className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rc-gold-dark">
                              Por cobrar
                            </td>
                            <td className="px-3 py-2 font-mono font-semibold text-rc-gold-dark">
                              {formatCRC(groupPorCobrar)}
                            </td>
                            <td colSpan={9} className="px-3 py-2 text-xs text-rc-ink/60">
                              {groupPorCobrarCount} pendiente{groupPorCobrarCount !== 1 ? "s" : ""}
                            </td>
                          </tr>
                        ) : null}
                        {cancelled > 0 ? (
                          <>
                            <tr className="border-t border-rc-line bg-rc-stamp/10">
                              <td colSpan={2} className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rc-stamp">
                                Total canceladas
                              </td>
                              <td className="px-3 py-2 font-mono font-semibold text-rc-stamp">
                                {formatCRC(groupCancelledTotal)}
                              </td>
                              <td colSpan={9} className="px-3 py-2 text-xs text-rc-ink/60">
                                {cancelled} cancelada{cancelled !== 1 ? "s" : ""}
                              </td>
                            </tr>
                            <tr className="border-t border-rc-line bg-[#4a6b46]/10">
                              <td colSpan={2} className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#4a6b46]">
                                Saldo restante
                              </td>
                              <td className="px-3 py-2 font-mono font-semibold text-[#4a6b46]">
                                {formatCRC(groupSaldo)}
                              </td>
                              <td colSpan={9} className="px-3 py-2 text-xs text-rc-ink/60">
                                descontando canceladas
                              </td>
                            </tr>
                          </>
                        ) : null}
                      </tfoot>
                    </table>
                  </TableScroller>
                </div>
              ) : null}
            </section>
          );
        })
      )}
    </div>
  );
}
