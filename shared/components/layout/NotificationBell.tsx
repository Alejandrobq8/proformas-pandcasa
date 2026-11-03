"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UpcomingDelivery = {
  id: string;
  number: string;
  clientNombre: string;
  clientEmpresa: string | null;
  note: string | null;
  source: "fecha" | "texto";
};

function tomorrowIso() {
  const CR_OFFSET_MS = 6 * 60 * 60 * 1000;
  const nowCR = new Date(Date.now() - CR_OFFSET_MS);
  const tomorrow = new Date(
    Date.UTC(nowCR.getUTCFullYear(), nowCR.getUTCMonth(), nowCR.getUTCDate() + 1)
  );
  return tomorrow.toISOString();
}

export function NotificationBell() {
  const [deliveries, setDeliveries] = useState<UpcomingDelivery[]>([]);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    fetch("/api/proformas/entregas-manana")
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setDeliveries(json.data ?? []))
      .catch(() => setDeliveries([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function confirmDetected(id: string) {
    setConfirming(id);
    try {
      const res = await fetch(`/api/proformas/${id}/delivery-dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: tomorrowIso() }),
      });
      if (res.ok) load();
    } finally {
      setConfirming(null);
    }
  }

  const count = deliveries.length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Entregas de mañana"
        aria-expanded={open}
        className="relative inline-flex items-center justify-center rounded-[3px] border border-rc-ink p-2.5 text-rc-ink transition hover:bg-rc-kraft"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rc-stamp px-1 font-mono text-[10px] font-bold text-rc-receipt-paper">
            {count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-[3px] border border-rc-ink bg-rc-paper shadow-[3px_4px_0_var(--rc-line)]">
          <div className="border-b border-rc-line px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rc-gold-dark">
              Entregas de mañana
            </p>
          </div>
          {count === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-rc-ink/60">
              No hay entregas programadas para mañana.
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-rc-line overflow-y-auto">
              {deliveries.map((d) => (
                <li key={`${d.id}-${d.source}`} className="px-4 py-2.5">
                  <a
                    href={`/proformas/${d.id}/edit`}
                    className="font-mono text-xs font-semibold text-rc-ink hover:underline"
                  >
                    {d.number}
                  </a>
                  <p className="mt-0.5 text-sm text-rc-ink">
                    {d.clientNombre}
                    {d.clientEmpresa ? ` (${d.clientEmpresa})` : ""}
                  </p>
                  {d.note ? <p className="mt-0.5 text-xs text-rc-ink/60">{d.note}</p> : null}
                  {d.source === "texto" ? (
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="rounded-[3px] bg-rc-gold-dark/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-rc-gold-dark">
                        Detectado en texto
                      </span>
                      <button
                        type="button"
                        onClick={() => confirmDetected(d.id)}
                        disabled={confirming === d.id}
                        className="text-[10px] font-semibold uppercase tracking-[0.1em] text-rc-ink underline hover:text-rc-gold-dark disabled:opacity-50"
                      >
                        {confirming === d.id ? "Confirmando..." : "Confirmar fecha"}
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
