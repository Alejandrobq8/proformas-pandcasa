import { z } from "zod";

export const clientSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  empresa: z.string().min(1, "Empresa requerida"),
  cedulaJuridica: z.string().min(1, "Cedula juridica requerida"),
});

export const proformaItemSchema = z.object({
  description: z.string().min(1, "Descripcion requerida"),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

export const proformaStatusSchema = z.enum(["DRAFT", "SENT", "PAID"]);

export const proformaSchema = z.object({
  clientId: z.string().optional().nullable(),
  clientNombre: z.string().min(1),
  clientEmpresa: z.string().min(1),
  clientCedulaJuridica: z.string().min(1),
  discount: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: proformaStatusSchema.optional(),
  items: z.array(proformaItemSchema).min(1),
});

export const companySettingsSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  contactName: z.string().optional().nullable(),
  cedula: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
});

export type ClientInput = z.infer<typeof clientSchema>;
export type ProformaInput = z.infer<typeof proformaSchema>;
export type ProformaStatus = z.infer<typeof proformaStatusSchema>;
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
