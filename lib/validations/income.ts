import { z } from "zod";

const incomeTypeEnum = z.enum(["monthly", "irregular", "occasional"]);

export const incomeSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser positivo"),
  currency: z.string().default("COP"),
  income_type: incomeTypeEnum,
  description: z.string().optional(),
  date: z.string().min(1, "Selecciona una fecha"),
  wallet_id: z.string().uuid("Selecciona una cuenta").optional(),
});

export type IncomeFormValues = z.infer<typeof incomeSchema>;
