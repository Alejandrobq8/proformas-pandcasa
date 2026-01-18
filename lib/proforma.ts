import type { ProformaInput } from "./validation";

export function calculateTotals(input: ProformaInput) {
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const discount = input.discount ?? 0;
  const total = subtotal - discount;
  return {
    subtotal,
    total,
  };
}
