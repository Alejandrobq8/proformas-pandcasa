export type ProformaItemRecord = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type ProformaStatus = "DRAFT" | "SENT" | "PAID";

export type ProformaRecord = {
  id: string;
  number: string;
  clientNombre: string;
  clientEmpresa: string;
  status: ProformaStatus;
  subtotal: number | string;
  total: number | string;
  items: ProformaItemRecord[];
};

export type ProformaFilters = {
  number: string;
  client: string;
  date: string;
  amountMin: string;
  amountMax: string;
};

export type ProformasResult = {
  data: ProformaRecord[];
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

export async function listProformas(
  filters: ProformaFilters,
  take: number
): Promise<ProformasResult> {
  const params = new URLSearchParams();
  if (filters.number.trim()) params.set("number", filters.number.trim());
  if (filters.client.trim()) params.set("client", filters.client.trim());
  if (filters.date.trim()) params.set("date", filters.date.trim());
  if (filters.amountMin.trim()) params.set("amountMin", filters.amountMin.trim());
  if (filters.amountMax.trim()) params.set("amountMax", filters.amountMax.trim());
  params.set("take", String(take));

  const res = await fetch(`/api/proformas?${params.toString()}`);
  const payload = await parseJsonOrThrow(res, "No se pudieron cargar las proformas.");
  return { data: payload?.data ?? [], total: payload?.total ?? 0 } as ProformasResult;
}

export async function deleteProforma(id: string): Promise<void> {
  const res = await fetch(`/api/proformas/${id}`, { method: "DELETE" });
  await parseJsonOrThrow(res, "No se pudo eliminar la proforma.");
}
