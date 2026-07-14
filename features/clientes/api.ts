import type { ClientInput } from "@/features/clientes/schema";

export type Cliente = {
  id: string;
  nombre: string;
  empresa?: string | null;
  cedulaJuridica?: string | null;
};

export type ClientesResult = {
  data: Cliente[];
  total: number;
};

async function parseJsonOrThrow(res: Response, fallbackMessage: string) {
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(payload?.error ?? fallbackMessage);
  }
  return payload;
}

export async function listClientes(query: string): Promise<ClientesResult> {
  const res = await fetch(
    `/api/clientes?q=${encodeURIComponent(query)}&take=25`
  );
  const payload = await parseJsonOrThrow(res, "No se pudieron cargar los clientes.");
  return { data: payload.data ?? [], total: payload.total ?? 0 };
}

export async function createCliente(input: ClientInput): Promise<Cliente> {
  const res = await fetch("/api/clientes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(res, "No se pudo crear el cliente.");
}

export async function updateCliente(
  id: string,
  input: ClientInput
): Promise<Cliente> {
  const res = await fetch(`/api/clientes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(res, "No se pudo actualizar el cliente.");
}

export async function deleteCliente(id: string): Promise<void> {
  const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
  await parseJsonOrThrow(res, "No se pudo eliminar el cliente.");
}
