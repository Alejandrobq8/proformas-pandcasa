"use client";

import { useEffect, useState } from "react";
import { Input } from "@/shared/components/ui/Input";

type Cliente = {
  id: string;
  nombre: string;
  empresa?: string | null;
  cedulaJuridica?: string | null;
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
    const label = [cliente.nombre, cliente.empresa ?? "", cliente.cedulaJuridica ?? ""]
      .filter(Boolean)
      .join(" - ");
    setQuery(label);
    setOpen(false);
  }

  return (
    <div className="relative">
      <Input
        placeholder="Buscar cliente..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 ? (
        <div className="absolute z-10 mt-1.5 w-full rounded-[3px] border border-rc-ink bg-rc-surface p-1.5 shadow-[3px_4px_0_var(--rc-line)]">
          {results.map((cliente) => (
            <button
              key={cliente.id}
              className="w-full rounded-[2px] px-3 py-2 text-left text-sm transition hover:bg-rc-kraft"
              onClick={() => handleSelect(cliente)}
              type="button"
            >
              <p className="font-semibold text-rc-ink">{cliente.nombre}</p>
              {cliente.empresa || cliente.cedulaJuridica ? (
                <p className="text-xs text-rc-ink/60">
                  {cliente.empresa ?? ""}
                  {cliente.cedulaJuridica
                    ? ` - ${cliente.cedulaJuridica}`
                    : ""}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
