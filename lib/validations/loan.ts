import { z } from "zod";

export const loanSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  principal: z.coerce.number().positive("El capital debe ser positivo"),
  annual_interest_rate: z.coerce.number().min(0, "La tasa no puede ser negativa"),
  term_months: z.coerce.number().int().positive("Plazo en meses debe ser positivo"),
  start_date: z.string().min(1, "Fecha de inicio requerida"),
  currency: z.string().min(1).default("COP"),
  description: z.string().optional(),
});

export const loanPaymentSchema = z.object({
  paid_at: z.string().min(1, "Fecha de pago requerida"),
  amount: z.coerce.number().positive("El monto debe ser positivo"),
  principal_portion: z.coerce.number().min(0),
  interest_portion: z.coerce.number().min(0),
  balance_after: z.coerce.number().min(0),
  wallet_id: z.string().uuid("Selecciona la cuenta desde la que pagas."),
});

export type LoanFormValues = z.infer<typeof loanSchema>;
export type LoanPaymentFormValues = z.infer<typeof loanPaymentSchema>;
