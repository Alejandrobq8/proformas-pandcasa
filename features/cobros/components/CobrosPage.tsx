"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { formatCRC } from "@/shared/lib/money";
import { sileo } from "sileo";

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
        className="overflow-x-scroll overflow-y-hidden border-b border-[var(--border)]"
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
  migo: number | null;
  numeroFactura: string | null;
  fechaPago: string | null;
  verificacionPago: boolean;
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
        className="w-full min-w-[90px] rounded-lg border border-[var(--amber-strong)] bg-[var(--paper)] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--amber)]"
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
      className={`min-w-[90px] w-full rounded-lg px-2 py-1 text-left text-sm transition hover:bg-[var(--sand)] ${
        isSaving ? "opacity-50 cursor-wait" : "cursor-text"
      }`}
    >
      {displayValue ? (
        displayValue
      ) : (
        <span className="text-[var(--cocoa)] opacity-50 select-none">{placeholder}</span>
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

  function startEdit(id: string, field: string, value: string) {
    setEditing({ id, field });
    setEditValue(value);
  }

  async function commitEdit(id: string, field: string) {
    if (editing?.id !== id || editing?.field !== field) return;
    setEditing(null);

    const proforma = proformas.find((p) => p.id === id);
    if (!proforma) return;

    let nextValue: string | number | null = editValue.trim() || null;
    if (field === "migo") {
      nextValue = editValue.trim() ? parseInt(editValue.trim(), 10) : null;
      if (nextValue !== null && isNaN(nextValue as number)) return;
    }

    const original = proforma[field as keyof Proforma];
    const originalStr =
      original === null || original === undefined ? "" : String(original);
    const newStr = nextValue === null ? "" : String(nextValue);
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

  async function toggleVerificacion(id: string, current: boolean) {
    setProformas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, verificacionPago: !current } : p))
    );
    try {
      const res = await fetch(`/api/proformas/${id}/cobro`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificacionPago: !current }),
      });
      if (!res.ok) throw new Error("error");
    } catch {
      setProformas((prev) =>
        prev.map((p) => (p.id === id ? { ...p, verificacionPago: current } : p))
      );
      sileo.error({
        title: "Error al guardar",
        description: "No se pudo actualizar la verificación.",
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
  }

  const filtersActive =
    filterNumber || filterClient || filterAmountMin || filterAmountMax || filterMigo;

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
  ];

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--paper)] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--cocoa)]">
            Filtros
          </p>
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
          const paid = group.items.filter((p) => p.verificacionPago).length;
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
                <div className="border-t border-[var(--border)]">
                <TableScroller>
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--sand)]">
                        {columns.map((col) => (
                          <th
                            key={col}
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
                        return (
                          <tr
                            key={p.id}
                            className={`border-b border-[var(--border)] last:border-0 transition-colors ${
                              isVerified
                                ? "bg-emerald-50/60 dark:bg-emerald-950/20"
                                : index % 2 === 1
                                ? "bg-[var(--sand)]/40"
                                : ""
                            }`}
                          >
                            {/* N° Proforma */}
                            <td className="px-3 py-2 whitespace-nowrap">
                              <a
                                href={`/proformas/${p.id}/edit`}
                                className="font-semibold text-[var(--accent)] transition hover:text-[var(--amber-strong)] hover:underline"
                              >
                                {p.number}
                              </a>
                            </td>

                            {/* Fecha */}
                            <td className="px-3 py-2 whitespace-nowrap text-[var(--cocoa)]">
                              {formatDateShort(p.createdAt)}
                            </td>

                            {/* Monto total */}
                            <td className="px-3 py-2 whitespace-nowrap font-semibold">
                              {formatCRC(Number(p.total))}
                            </td>

                            {/* Descripción entrega */}
                            <td className="px-3 py-2 max-w-[200px]">
                              {p.notes ? (
                                <span
                                  className="block truncate text-[var(--cocoa)]"
                                  title={p.notes}
                                >
                                  {p.notes}
                                </span>
                              ) : (
                                <span className="text-[var(--cocoa)] opacity-40">—</span>
                              )}
                            </td>

                            {/* Solicitante */}
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="font-medium">{p.clientNombre}</span>
                              {p.clientEmpresa && (
                                <span className="block text-xs text-[var(--cocoa)]">
                                  {p.clientEmpresa}
                                </span>
                              )}
                            </td>

                            {/* Orden de Compra */}
                            <td className="px-3 py-2">
                              <EditableCell
                                isActive={
                                  editing?.id === p.id &&
                                  editing?.field === "ordenCompra"
                                }
                                isSaving={saving.has(`${p.id}:ordenCompra`)}
                                displayValue={p.ordenCompra ?? ""}
                                inputValue={editValue}
                                placeholder="—"
                                onActivate={() =>
                                  startEdit(p.id, "ordenCompra", p.ordenCompra ?? "")
                                }
                                onCommit={() => commitEdit(p.id, "ordenCompra")}
                                onCancel={() => setEditing(null)}
                                onChange={setEditValue}
                              />
                            </td>

                            {/* MIGO */}
                            <td className="px-3 py-2">
                              <EditableCell
                                isActive={
                                  editing?.id === p.id && editing?.field === "migo"
                                }
                                isSaving={saving.has(`${p.id}:migo`)}
                                displayValue={
                                  p.migo !== null ? String(p.migo) : ""
                                }
                                inputValue={editValue}
                                inputType="number"
                                placeholder="—"
                                onActivate={() =>
                                  startEdit(
                                    p.id,
                                    "migo",
                                    p.migo !== null ? String(p.migo) : ""
                                  )
                                }
                                onCommit={() => commitEdit(p.id, "migo")}
                                onCancel={() => setEditing(null)}
                                onChange={setEditValue}
                              />
                            </td>

                            {/* N° Factura */}
                            <td className="px-3 py-2">
                              <EditableCell
                                isActive={
                                  editing?.id === p.id &&
                                  editing?.field === "numeroFactura"
                                }
                                isSaving={saving.has(`${p.id}:numeroFactura`)}
                                displayValue={p.numeroFactura ?? ""}
                                inputValue={editValue}
                                placeholder="—"
                                onActivate={() =>
                                  startEdit(
                                    p.id,
                                    "numeroFactura",
                                    p.numeroFactura ?? ""
                                  )
                                }
                                onCommit={() => commitEdit(p.id, "numeroFactura")}
                                onCancel={() => setEditing(null)}
                                onChange={setEditValue}
                              />
                            </td>

                            {/* Fecha de pago */}
                            <td className="px-3 py-2">
                              <EditableCell
                                isActive={
                                  editing?.id === p.id &&
                                  editing?.field === "fechaPago"
                                }
                                isSaving={saving.has(`${p.id}:fechaPago`)}
                                displayValue={formatDateShort(p.fechaPago)}
                                inputValue={editValue}
                                inputType="date"
                                placeholder="—"
                                onActivate={() =>
                                  startEdit(
                                    p.id,
                                    "fechaPago",
                                    toInputDate(p.fechaPago)
                                  )
                                }
                                onCommit={() => commitEdit(p.id, "fechaPago")}
                                onCancel={() => setEditing(null)}
                                onChange={setEditValue}
                              />
                            </td>

                            {/* Verificación */}
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isVerified}
                                onChange={() =>
                                  toggleVerificacion(p.id, isVerified)
                                }
                                className="h-4 w-4 cursor-pointer accent-emerald-600"
                                title={
                                  isVerified
                                    ? "Pago verificado"
                                    : "Marcar como verificado"
                                }
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </TableScroller>
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
