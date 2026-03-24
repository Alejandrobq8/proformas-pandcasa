import { z } from "zod";

export const menuCategorySchema = z.enum([
  "BOCADILLOS",
  "POSTRES",
  "QUEQUES",
]);

export const menuItemSchema = z.object({
  category: menuCategorySchema,
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional().nullable(),
  price: z.number().nonnegative(),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type MenuCategory = z.infer<typeof menuCategorySchema>;
