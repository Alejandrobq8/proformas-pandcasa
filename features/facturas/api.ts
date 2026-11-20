export type FacturaRecord = {
  id: string;
  number: string;
  clientNombre: string;
  clientCedula: string | null;
  issueDate: string;
  subtotal: number | string;
  total: number | string;
};

export type FacturaFilters = {
  number: string;
  client: string;
  date: string;
};

export type FacturasResult = {
  data: FacturaRecord[];
  total: number;
};

async function parseJsonOrThrow(res: Response, fallbackMessage: string) {
  let payload: Record<string, unknown> | null = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (!res.ok) {
    const message = payload?.error ?? payload?.message;
    throw new Error(typeof message === "string" ? message : fallbackMessage);
  }
  return payload;
}

export async function listFacturas(
  filters: FacturaFilters,
  take: number
): Promise<FacturasResult> {
  const params = new URLSearchParams();
  if (filters.number.trim()) params.set("number", filters.number.trim());
  if (filters.client.trim()) params.set("client", filters.client.trim());
  if (filters.date.trim()) params.set("date", filters.date.trim());
  params.set("take", String(take));

  const res = await fetch(`/api/facturas?${params.toString()}`);
  const payload = await parseJsonOrThrow(res, "No se pudieron cargar las facturas.");
  return { data: payload?.data ?? [], total: payload?.total ?? 0 } as FacturasResult;
}

export async function deleteFactura(id: string): Promise<void> {
  const res = await fetch(`/api/facturas/${id}`, { method: "DELETE" });
  await parseJsonOrThrow(res, "No se pudo eliminar la factura.");
}
