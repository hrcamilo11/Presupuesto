import { z } from "zod";

const frequencyEnum = z.enum(["monthly", "yearly"]);

export const subscriptionSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  amount: z.coerce.number().positive("El monto debe ser positivo"),
  currency: z.string().default("COP"),
  frequency: frequencyEnum,
  next_due_date: z.string().min(1, "Fecha de próximo pago requerida"),
  description: z.string().optional(),
});

export type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;
