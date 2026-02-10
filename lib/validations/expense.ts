import { z } from "zod";

const expensePriorityEnum = z.enum(["obligatory", "necessary", "optional"]);

export const expenseSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser positivo"),
  currency: z.string().min(1).default("COP"),
  expense_priority: expensePriorityEnum,
  description: z.string().optional().nullable(),
  date: z.string().min(1, "Selecciona una fecha"),
  category_id: z.string().uuid().optional().nullable(),
  wallet_id: z.string().uuid().optional().nullable(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
