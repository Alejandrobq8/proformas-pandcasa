import { z } from "zod";

export const facturaItemSchema = z.object({
  description: z.string().min(1, "Descripcion requerida"),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

export const facturaSchema = z.object({
  clientId: z.string().optional().nullable(),
  clientNombre: z.string().min(1, "Nombre requerido"),
  clientCedula: z.string().optional(),
  issueDate: z.string().min(1, "Fecha requerida"),
  showUnitPrice: z.boolean().optional(),
  discount: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(facturaItemSchema).min(1),
});

export type FacturaInput = z.infer<typeof facturaSchema>;

export function calculateFacturaTotals(input: FacturaInput) {
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const total = Math.max(subtotal - (input.discount ?? 0), 0);
  return { subtotal, total };
}
