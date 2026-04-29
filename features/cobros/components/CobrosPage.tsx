"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { formatCRC } from "@/shared/lib/money";
import { sileo } from "sileo";

type Proforma = {
  id: string;
  number: string;
  createdAt: string;
  total: string | number;
  notes: string | null;
  clientNombre: string;
  clientEmpresa: string | null;
  ordenCompra: string | null;
  migo: number | null;
  numeroFactura: string | null;
  fechaPago: string | null;
  verificacionPago: boolean;
  sinpeTransf: boolean;
};

type RowDraft = {
  ordenCompra: string;
  migo: string;
  numeroFactura: string;
  fechaPago: string;
};

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
  return new Date(dateStr).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function toInputDate(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition";

const labelClass = "block text-xs uppercase tracking-[0.2em] text-[var(--cocoa)] mb-1";

export function CobrosPage() {
  const [filterNumber, setFilterNumber] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterAmountMin, setFilterAmountMin] = useState("");
  const [filterAmountMax, setFilterAmountMax] = useState("");
  const [filterMigo, setFilterMigo] = useState("");

  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const currentMonthKey = getCurrentMonthKey();
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [monthsInitialized, setMonthsInitialized] = useState(false);

  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [rowDraft, setRowDraft] = useState<RowDraft>({
    ordenCompra: "",
    migo: "",
    numeroFactura: "",
    fechaPago: "",
  });
  const [rowSaving, setRowSaving] = useState(false);

  const fetchProformas = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ take: "9999", skip: "0" });
    if (filterNumber) params.set("number", filterNumber);
    if (filterClient) params.set("client", filterClient);
    if (filterAmountMin) params.set("amountMin", filterAmountMin);
    if (filterAmountMax) params.set("amountMax", filterAmountMax);
    if (filterMigo) params.set("migo", filterMigo);
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
  }, [filterNumber, filterClient, filterAmountMin, filterAmountMax, filterMigo]);

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
      .map(([key, items]) => ({ key, label: formatMonthLabel(key), items }));
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

  function openRow(p: Proforma) {
    if (expandedRow === p.id) {
      setExpandedRow(null);
      return;
    }
    setExpandedRow(p.id);
    setRowDraft({
      ordenCompra: p.ordenCompra ?? "",
      migo: p.migo !== null ? String(p.migo) : "",
      numeroFactura: p.numeroFactura ?? "",
      fechaPago: toInputDate(p.fechaPago),
    });
  }

  async function saveRow(id: string) {
    setRowSaving(true);
    const body = {
      ordenCompra: rowDraft.ordenCompra.trim() || null,
      migo: rowDraft.migo.trim() ? parseInt(rowDraft.migo, 10) : null,
      numeroFactura: rowDraft.numeroFactura.trim() || null,
      fechaPago: rowDraft.fechaPago || null,
    };
    try {
      const res = await fetch(`/api/proformas/${id}/cobro`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("error");
      const updated = await res.json();
      setProformas((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
      setExpandedRow(null);
      sileo.success({ title: "Guardado", description: "Cambios guardados correctamente.", duration: 2000 });
    } catch {
      sileo.error({ title: "Error al guardar", description: "No se pudo guardar los cambios.", duration: 2500 });
    } finally {
      setRowSaving(false);
    }
  }

  async function toggleBoolean(id: string, field: "verificacionPago" | "sinpeTransf", current: boolean) {
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
      sileo.error({ title: "Error al guardar", description: "No se pudo actualizar el campo.", duration: 2500 });
    }
  }

  function clearFilters() {
    setFilterNumber("");
    setFilterClient("");
    setFilterAmountMin("");
    setFilterAmountMax("");
    setFilterMigo("");
  }

  const filtersActive =
    filterNumber || filterClient || filterAmountMin || filterAmountMax || filterMigo;

  const columns = [
    "",
    "N° Proforma",
    "Fecha",
    "Monto Total",
    "Descripción Entrega",
    "Solicitante",
    "Verificado",
    "SINPE/TRANSF.",
  ];

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">Filtros</p>
          {filtersActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs uppercase tracking-[0.2em] text-[var(--accent)] transition hover:text-[var(--amber-strong)]"
            >
              Limpiar
            </button>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-2.5 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
            placeholder="N° proforma"
            value={filterNumber}
            onChange={(e) => setFilterNumber(e.target.value)}
          />
          <input
            className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-2.5 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
            placeholder="Solicitante"
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
          />
          <input
            className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-2.5 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
            placeholder="Monto mínimo"
            type="number"
            min={0}
            value={filterAmountMin}
            onChange={(e) => setFilterAmountMin(e.target.value)}
          />
          <input
            className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-2.5 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
            placeholder="Monto máximo"
            type="number"
            min={0}
            value={filterAmountMax}
            onChange={(e) => setFilterAmountMax(e.target.value)}
          />
          <input
            className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-2.5 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
            placeholder="MIGO"
            type="number"
            min={0}
            value={filterMigo}
            onChange={(e) => setFilterMigo(e.target.value)}
          />
        </div>
      </div>

      {/* Summary */}
      {!loading && (
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--cocoa)]">
          {total} proforma{total !== 1 ? "s" : ""}{" "}
          {filtersActive ? "encontrada" + (total !== 1 ? "s" : "") : "en total"}
        </p>
      )}

      {/* Error */}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Loading */}
      {loading ? (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] px-6 py-12 text-center text-sm text-[var(--cocoa)] shadow-sm">
          Cargando...
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--paper)] px-6 py-12 text-center shadow-sm">
          <p className="text-sm text-[var(--cocoa)]">
            {filtersActive
              ? "No se encontraron proformas con esos filtros."
              : "Aún no hay proformas registradas."}
          </p>
        </div>
      ) : (
        grouped.map((group) => {
          const isCollapsed = collapsedMonths.has(group.key);
          const paid = group.items.filter((p) => p.verificacionPago || p.sinpeTransf).length;
          const pending = group.items.length - paid;

          return (
            <section
              key={group.key}
              className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] shadow-sm overflow-hidden"
            >
              {/* Month header */}
              <button
                type="button"
                onClick={() => toggleMonth(group.key)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-[var(--sand)]"
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
                    className={`text-[var(--cocoa)] transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  <h2 className="font-[var(--font-cormorant)] text-xl font-semibold">
                    {group.label}
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[var(--cocoa)]">
                  <span className="hidden sm:block">
                    {group.items.length} proforma{group.items.length !== 1 ? "s" : ""}
                  </span>
                  {paid > 0 && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
                      {paid} pagada{paid !== 1 ? "s" : ""}
                    </span>
                  )}
                  {pending > 0 && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-700">
                      {pending} pendiente{pending !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </button>

              {/* Table */}
              {!isCollapsed && (
                <div className="overflow-x-auto border-t border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--sand)]">
                        {columns.map((col, i) => (
                          <th
                            key={i}
                            className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--cocoa)] whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((p, index) => {
                        const isVerified = p.verificacionPago;
                        const isExpanded = expandedRow === p.id;
                        const hasDetails = !!(p.ordenCompra || p.migo || p.numeroFactura || p.fechaPago);

                        return (
                          <>
                            <tr
                              key={p.id}
                              className={`border-b border-[var(--border)] transition-colors cursor-pointer select-none ${
                                isExpanded
                                  ? "bg-[var(--sand)]"
                                  : isVerified || p.sinpeTransf
                                  ? "bg-emerald-50/60 hover:bg-emerald-50 dark:bg-emerald-950/20"
                                  : index % 2 === 1
                                  ? "bg-[var(--sand)]/40 hover:bg-[var(--sand)]"
                                  : "hover:bg-[var(--sand)]/60"
                              }`}
                              onClick={() => openRow(p)}
                            >
                              {/* Chevron */}
                              <td className="w-8 pl-4 pr-1 py-2.5">
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className={`text-[var(--cocoa)] transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                                  aria-hidden="true"
                                >
                                  <path d="m9 18 6-6-6-6" />
                                </svg>
                              </td>

                              {/* N° Proforma */}
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <a
                                  href={`/proformas/${p.id}/edit`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-semibold text-[var(--accent)] transition hover:text-[var(--amber-strong)] hover:underline"
                                >
                                  {p.number}
                                </a>
                                {hasDetails && (
                                  <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)] opacity-60 align-middle" title="Tiene datos de cobro" />
                                )}
                              </td>

                              {/* Fecha */}
                              <td className="px-3 py-2.5 whitespace-nowrap text-[var(--cocoa)]">
                                {formatDateShort(p.createdAt)}
                              </td>

                              {/* Monto */}
                              <td className="px-3 py-2.5 whitespace-nowrap font-semibold">
                                {formatCRC(Number(p.total))}
                              </td>

                              {/* Descripción entrega */}
                              <td className="px-3 py-2.5 max-w-[220px]">
                                {p.notes ? (
                                  <span className="block truncate text-[var(--cocoa)]" title={p.notes}>
                                    {p.notes}
                                  </span>
                                ) : (
                                  <span className="text-[var(--cocoa)] opacity-40">—</span>
                                )}
                              </td>

                              {/* Solicitante */}
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <span className="font-medium">{p.clientNombre}</span>
                                {p.clientEmpresa && (
                                  <span className="block text-xs text-[var(--cocoa)]">
                                    {p.clientEmpresa}
                                  </span>
                                )}
                              </td>

                              {/* Verificado */}
                              <td
                                className="px-3 py-2.5 text-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={isVerified}
                                  onChange={() => toggleBoolean(p.id, "verificacionPago", isVerified)}
                                  className="h-4 w-4 cursor-pointer accent-emerald-600"
                                  title={isVerified ? "Pago verificado" : "Marcar como verificado"}
                                />
                              </td>

                              {/* SINPE/TRANSF. */}
                              <td
                                className="px-3 py-2.5 text-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={p.sinpeTransf}
                                  onChange={() => toggleBoolean(p.id, "sinpeTransf", p.sinpeTransf)}
                                  className="h-4 w-4 cursor-pointer accent-blue-600"
                                  title={p.sinpeTransf ? "SINPE/Transferencia confirmada" : "Marcar como SINPE/Transferencia"}
                                />
                              </td>
                            </tr>

                            {/* Expanded row */}
                            {isExpanded && (
                              <tr key={`${p.id}-expanded`} className="border-b border-[var(--border)]">
                                <td colSpan={8} className="p-0">
                                  <div className="border-t border-[var(--amber)] bg-[var(--sand)] px-6 py-5">
                                    <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[var(--cocoa)]">
                                      Datos de cobro — {p.number}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className={labelClass}>Orden de Compra</label>
                                        <input
                                          className={inputClass}
                                          value={rowDraft.ordenCompra}
                                          onChange={(e) =>
                                            setRowDraft((d) => ({ ...d, ordenCompra: e.target.value }))
                                          }
                                          placeholder="OC-0000"
                                        />
                                      </div>
                                      <div>
                                        <label className={labelClass}>MIGO</label>
                                        <input
                                          className={inputClass}
                                          type="number"
                                          min={0}
                                          value={rowDraft.migo}
                                          onChange={(e) =>
                                            setRowDraft((d) => ({ ...d, migo: e.target.value }))
                                          }
                                          placeholder="000000"
                                        />
                                      </div>
                                      <div>
                                        <label className={labelClass}>N° Factura</label>
                                        <input
                                          className={inputClass}
                                          value={rowDraft.numeroFactura}
                                          onChange={(e) =>
                                            setRowDraft((d) => ({ ...d, numeroFactura: e.target.value }))
                                          }
                                          placeholder="FE-0000"
                                        />
                                      </div>
                                      <div>
                                        <label className={labelClass}>Fecha de Pago</label>
                                        <input
                                          className={inputClass}
                                          type="date"
                                          value={rowDraft.fechaPago}
                                          onChange={(e) =>
                                            setRowDraft((d) => ({ ...d, fechaPago: e.target.value }))
                                          }
                                        />
                                      </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--cocoa)]">
                                        {p.ordenCompra && <span>OC actual: <strong>{p.ordenCompra}</strong></span>}
                                        {p.migo && <span>MIGO actual: <strong>{p.migo}</strong></span>}
                                        {p.numeroFactura && <span>Factura actual: <strong>{p.numeroFactura}</strong></span>}
                                        {p.fechaPago && <span>Pago: <strong>{formatDateShort(p.fechaPago)}</strong></span>}
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0 ml-4">
                                        <button
                                          type="button"
                                          onClick={() => setExpandedRow(null)}
                                          className="btn-secondary inline-flex items-center rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition hover:border-[var(--amber-strong)]"
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          type="button"
                                          disabled={rowSaving}
                                          onClick={() => saveRow(p.id)}
                                          className="btn-primary inline-flex items-center rounded-full px-5 py-2 text-xs font-semibold shadow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          {rowSaving ? "Guardando..." : "Guardar"}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[var(--border)] bg-[var(--sand)]">
                        <td colSpan={3} className="px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cocoa)]">
                          Total pagado
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-emerald-700">
                          {formatCRC(
                            group.items
                              .filter((p) => p.verificacionPago || p.sinpeTransf)
                              .reduce((sum, p) => sum + Number(p.total), 0)
                          )}
                        </td>
                        <td colSpan={4} className="px-3 py-2.5 text-xs text-[var(--cocoa)]">
                          {group.items.filter((p) => p.verificacionPago || p.sinpeTransf).length} de {group.items.length} proforma{group.items.length !== 1 ? "s" : ""} pagada{group.items.filter((p) => p.verificacionPago || p.sinpeTransf).length !== 1 ? "s" : ""}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
