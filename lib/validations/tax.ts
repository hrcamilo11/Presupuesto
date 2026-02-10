import { z } from "zod";

const periodEnum = z.enum(["monthly", "quarterly", "yearly"]);

export const taxObligationSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  amount: z.coerce.number().positive("El monto debe ser positivo"),
  currency: z.string().default("COP"),
  period_type: periodEnum,
  due_date: z.string().min(1, "Fecha de vencimiento requerida"),
  paid_at: z.string().optional(),
  notes: z.string().optional(),
});

export type TaxObligationFormValues = z.infer<typeof taxObligationSchema>;
