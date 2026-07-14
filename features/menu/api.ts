import type { MenuCategory, MenuItemInput } from "@/features/menu/schema";

export type MenuItemRecord = {
  id: string;
  category: MenuCategory;
  name: string;
  description: string | null;
  price: number | string;
};

export type MenuItemsResult = {
  data: MenuItemRecord[];
  total: number;
};

async function parseJsonOrThrow(res: Response, fallbackMessage: string) {
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(payload?.error ?? fallbackMessage);
  }
  return payload;
}

export async function listMenuItems(
  query: string,
  category: MenuCategory
): Promise<MenuItemsResult> {
  const res = await fetch(
    `/api/menu-items?q=${encodeURIComponent(query)}&category=${category}`
  );
  const payload = await parseJsonOrThrow(res, "No se pudieron cargar los productos.");
  return { data: payload.data ?? [], total: payload.total ?? 0 };
}

export async function createMenuItem(
  input: MenuItemInput
): Promise<MenuItemRecord> {
  const res = await fetch("/api/menu-items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(res, "No se pudo guardar el producto.");
}

export async function updateMenuItem(
  id: string,
  input: MenuItemInput
): Promise<MenuItemRecord> {
  const res = await fetch(`/api/menu-items/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow(res, "No se pudo guardar el producto.");
}

export async function deleteMenuItem(id: string): Promise<void> {
  const res = await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
  await parseJsonOrThrow(res, "No se pudo eliminar el producto.");
}
