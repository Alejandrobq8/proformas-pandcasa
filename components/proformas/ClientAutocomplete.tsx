"use client";

import { useEffect, useState } from "react";

type Cliente = {
  id: string;
  nombre: string;
  empresa: string;
  cedulaJuridica: string;
};

export function ClientAutocomplete({
  onSelect,
}: {
  onSelect: (cliente: Cliente) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Cliente[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      const res = await fetch(
        `/api/clientes?q=${encodeURIComponent(query)}&take=6`
      );
      const payload = await res.json();
      setResults(payload.data ?? []);
      setOpen(true);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  function handleSelect(cliente: Cliente) {
    onSelect(cliente);
    setQuery(
      cliente.nombre +
        " - " +
        cliente.empresa +
        " - " +
        cliente.cedulaJuridica
    );
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm focus:border-[var(--amber-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--amber)] transition"
        placeholder="Buscar cliente..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 ? (
        <div className="absolute z-10 mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-2 shadow-lg">
          {results.map((cliente) => (
            <button
              key={cliente.id}
              className="w-full rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[var(--sand)]"
              onClick={() => handleSelect(cliente)}
              type="button"
            >
              <p className="font-semibold">{cliente.nombre}</p>
              <p className="text-xs text-[var(--cocoa)]">
                {cliente.empresa} - {cliente.cedulaJuridica}
              </p>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
