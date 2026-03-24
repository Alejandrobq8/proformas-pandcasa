import { z } from "zod";

export const clientSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  empresa: z.string().optional(),
  cedulaJuridica: z.string().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
