import { z } from "zod";

const baseWalletSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  type: z.enum(["cash", "debit", "credit", "investment"]),
  currency: z.string().min(3).max(3),
  balance: z.number().min(0, "El balance no puede ser negativo").optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "El color debe ser un código hexadecimal válido (ej: #FF5733)").optional().nullable(),
  bank: z.string().max(100).optional().nullable(),
  debit_card_brand: z.string().max(50).optional().nullable(),
  last_four_digits: z
    .string()
    .max(4, "Máximo 4 dígitos")
    .regex(/^\d{0,4}$/, "Solo números")
    .optional()
    .nullable()
    .transform((v) => (v === "" || v == null ? undefined : v)),
  // Campos para inversión
  investment_yield_rate: z.number().min(0, "El rendimiento no puede ser negativo").optional(),
  investment_term: z.string().max(100).optional(),
  investment_start_date: z.string().optional(),
  // Campos opcionales para crédito; se validan condicionalmente más abajo
  credit_mode: z.enum(["account", "card"]).optional(),
  card_brand: z.string().max(50).optional(),
  cut_off_day: z
    .number()
    .int("La fecha de corte debe ser un número entero")
    .min(1, "La fecha de corte debe estar entre 1 y 31")
    .max(31, "La fecha de corte debe estar entre 1 y 31")
    .optional(),
  payment_due_day: z
    .number()
    .int("El día de pago debe ser un número entero")
    .min(1, "El día de pago debe estar entre 1 y 31")
    .max(31, "El día de pago debe estar entre 1 y 31")
    .optional(),
  credit_limit: z.number().min(0, "El cupo no puede ser negativo").optional(),
  cash_advance_limit: z.number().min(0, "El cupo de avances no puede ser negativo").optional(),
  purchase_interest_rate: z
    .number()
    .min(0, "La tasa de interés no puede ser negativa")
    .optional(),
  cash_advance_interest_rate: z
    .number()
    .min(0, "La tasa de interés de avances no puede ser negativa")
    .optional(),
});

export const walletSchema = baseWalletSchema.superRefine((value, ctx) => {
  if (value.type === "debit") {
    if (!value.bank) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bank"],
        message: "Selecciona el banco de la cuenta débito.",
      });
    }
  }
  if (value.type === "credit") {
    if (!value.credit_mode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["credit_mode"],
        message: "Debes indicar si es cuenta de crédito o tarjeta de crédito.",
      });
    }
    if (value.credit_mode === "card") {
      if (!value.card_brand) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["card_brand"],
          message: "Selecciona la franquicia o tipo de tarjeta.",
        });
      }
      if (value.cut_off_day === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cut_off_day"],
          message: "Indica el día de corte de la tarjeta.",
        });
      }
      if (value.credit_limit === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["credit_limit"],
          message: "Indica el cupo total de la tarjeta.",
        });
      }
      if (value.purchase_interest_rate === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["purchase_interest_rate"],
          message: "Indica la tasa de interés para compras.",
        });
      }
      if (value.cash_advance_interest_rate === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cash_advance_interest_rate"],
          message: "Indica la tasa de interés para avances.",
        });
      }
    }
  }
});

export type WalletSchema = z.infer<typeof walletSchema>;
