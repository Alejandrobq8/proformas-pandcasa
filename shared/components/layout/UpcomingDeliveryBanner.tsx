"use client";

import { useEffect, useState } from "react";

type UpcomingDelivery = {
  id: string;
  number: string;
  clientNombre: string;
  clientEmpresa: string | null;
  notes: string | null;
};

export function UpcomingDeliveryBanner() {
  const [deliveries, setDeliveries] = useState<UpcomingDelivery[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/proformas/entregas-manana")
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        if (!cancelled) setDeliveries(json.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setDeliveries([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (dismissed || deliveries.length === 0) return null;

  return (
    <div className="border-b border-rc-stamp bg-rc-stamp/10 px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rc-stamp">
            {deliveries.length} entrega{deliveries.length !== 1 ? "s" : ""} para mañana
          </p>
          <ul className="mt-1.5 space-y-1 text-sm text-rc-ink">
            {deliveries.map((d) => (
              <li key={d.id}>
                <a
                  href={`/proformas/${d.id}/edit`}
                  className="font-mono font-semibold text-rc-ink hover:underline"
                >
                  {d.number}
                </a>{" "}
                — {d.clientNombre}
                {d.clientEmpresa ? ` (${d.clientEmpresa})` : ""}
                {d.notes ? (
                  <span className="text-rc-ink/60"> · {d.notes}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-[3px] px-2 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-rc-stamp transition hover:bg-rc-stamp/15"
        >
          Ocultar
        </button>
      </div>
    </div>
  );
}
