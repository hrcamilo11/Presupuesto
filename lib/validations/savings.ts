import { z } from "zod";

export const savingsGoalSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    target_amount: z.number().positive("La meta debe ser mayor a 0"),
    target_date: z.string().optional(), // Date string YYYY-MM-DD
    type: z.enum(["manual", "recurring"]),
    shared_account_id: z.string().optional().nullable(),
    color: z.string().optional(),
    icon: z.string().optional(),
});

export const contributionSchema = z.object({
    savings_goal_id: z.string().uuid(),
    wallet_id: z.string().uuid("Selecciona una cuenta de origen"),
    amount: z.number().positive("El monto debe ser mayor a 0"),
    date: z.string(), // YYYY-MM-DD
    notes: z.string().optional(),
});

export type SavingsGoalSchema = z.infer<typeof savingsGoalSchema>;
export type ContributionSchema = z.infer<typeof contributionSchema>;
