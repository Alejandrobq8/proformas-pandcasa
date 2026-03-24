import { z } from "zod";

export const companySettingsSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  contactName: z.string().optional().nullable(),
  cedula: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
