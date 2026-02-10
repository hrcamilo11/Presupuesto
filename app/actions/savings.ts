"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { contributionSchema, savingsGoalSchema, type SavingsGoalSchema } from "@/lib/validations/savings";
import type { SharedSavingsGoal } from "@/lib/database.types";

export async function getSavingsGoals() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "No autenticado" };

    // Fetch own goals OR shared goals
    // The RLS policy handles filtering, but we need to ensure we select correctly.
    const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
}

export async function getSharedSavingsGoals(sharedAccountId?: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "No autenticado" };

    let query = supabase
        .from("shared_savings_goals")
        .select("*")
        .order("created_at", { ascending: false });

    if (sharedAccountId) {
        query = query.eq("shared_account_id", sharedAccountId);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as SharedSavingsGoal[], error: null };
}

export async function createSharedSavingsGoal(input: {
    shared_account_id: string;
    name: string;
    target_amount: number;
    deadline?: string | null;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const trimmed = input.name.trim();
    if (!trimmed) return { error: "El nombre es obligatorio" };
    if (!input.shared_account_id) return { error: "Selecciona un grupo compartido" };
    if (!input.target_amount || input.target_amount <= 0) {
        return { error: "La meta debe ser mayor a 0" };
    }

    const { error } = await supabase.from("shared_savings_goals").insert({
        shared_account_id: input.shared_account_id,
        name: trimmed,
        target_amount: input.target_amount,
        deadline: input.deadline || null,
    });

    if (error) return { error: error.message };
    revalidatePath("/savings");
    revalidatePath("/dashboard");
    return { error: null };
}

export async function createSavingsGoal(formData: SavingsGoalSchema) {
    try {
        console.log("Creating savings goal with raw data:", formData);

        const parsed = savingsGoalSchema.safeParse(formData);
        if (!parsed.success) {
            const message =
                parsed.error.issues.map((i) => i.message).join(" ") || "Datos inválidos para la meta de ahorro.";
            console.error("Validation error in createSavingsGoal:", message, parsed.error.issues);
            return { error: message };
        }

        const data = parsed.data;
        console.log("Validation passed with data:", data);
        const supabase = await createClient();

        // Get user
        const {
            data: { user },
        } = await supabase.auth.getUser();

        console.log("Auth check - User ID:", user?.id);

        if (!user) return { error: "No autenticado" };

        // Log what we're about to insert
        const insertData = {
            user_id: user.id,
            name: data.name,
            target_amount: Number(data.target_amount),
            target_date: data.target_date || null,
            type: data.type || "manual",
            shared_account_id: data.shared_account_id || null,
            color: data.color,
            icon: data.icon,
        };

        console.log("Attempting to insert:", insertData);

        // 1. Create the Goal
        const { data: goal, error: goalError } = await supabase
            .from("savings_goals")
            .insert(insertData)
            .select()
            .single();

        if (goalError) {
            console.error("Error creating goal:", goalError);
            console.error("Full error details:", JSON.stringify(goalError, null, 2));
            return { error: goalError.message };
        }

        // 2. Create the Plan if requested
        if (data.type === "recurring" && data.plan && goal) {
            const { error: planError } = await supabase.from("savings_plans").insert({
                user_id: user.id,
                savings_goal_id: goal.id,
                wallet_id: data.plan.wallet_id,
                amount: Number(data.plan.amount),
                frequency: data.plan.frequency,
                day_of_period: Number(data.plan.day_of_period),
            });

            if (planError) {
                console.error("Error creating plan:", planError);
                return { error: `La meta fue creada pero el plan de ahorro falló: ${planError.message}` };
            }
        }

        console.log("Savings goal created successfully");
        revalidatePath("/savings");
        revalidatePath("/dashboard");
        return { error: null };
    } catch (e: unknown) {
        console.error("Critical error in createSavingsGoal:", e);
        return { error: e instanceof Error ? e.message : "Error interno del servidor" };
    }
}

export async function contributeToSavings(formData: {
    savings_goal_id: string;
    wallet_id: string;
    amount: number;
    date: string;
    notes?: string;
}) {
    const parsed = contributionSchema.safeParse(formData);
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    // Call the RPC function
    const { error } = await supabase.rpc("contribute_to_savings", {
        p_savings_goal_id: formData.savings_goal_id,
        p_wallet_id: formData.wallet_id,
        p_amount: formData.amount,
        p_date: formData.date,
        p_notes: formData.notes || "",
    });

    if (error) return { error: error.message };

    revalidatePath("/savings");
    revalidatePath("/wallets");
    revalidatePath("/dashboard");
    return { error: null };
}

export async function deleteSavingsGoal(id: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { error } = await supabase
        .from("savings_goals")
        .delete()
        .eq("id", id);

    if (error) return { error: error.message };
    revalidatePath("/savings");
    revalidatePath("/dashboard");
    return { error: null };
}

export async function getSavingsPlans() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "No autenticado" };

    const { data, error } = await supabase
        .from("savings_plans")
        .select(`
            *,
            goal:savings_goals(name),
            wallet:wallets(name)
        `)
        .eq("user_id", user.id);

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
}

export async function createSavingsPlan(formData: {
    savings_goal_id: string;
    wallet_id: string;
    amount: number;
    frequency: "weekly" | "monthly";
    day_of_period: number;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { error } = await supabase.from("savings_plans").insert({
        user_id: user.id,
        savings_goal_id: formData.savings_goal_id,
        wallet_id: formData.wallet_id,
        amount: formData.amount,
        frequency: formData.frequency,
        day_of_period: formData.day_of_period,
    });

    if (error) return { error: error.message };
    revalidatePath("/savings");
    return { error: null };
}

/**
 * Basic logic to process recurring savings.
 * In a real app, this would be a CRON job.
 * Here we can call it when the user logs in as a fallback.
 */
export async function processRecurringSavings() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    // Get active plans
    const { data: plans, error } = await supabase
        .from("savings_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

    if (error) return { error: error.message };
    if (!plans || plans.length === 0) return { success: true };

    const now = new Date();

    for (const plan of plans) {
        let shouldExecute = false;
        const lastExec = plan.last_executed ? new Date(plan.last_executed) : null;

        if (plan.frequency === "monthly") {
            const currentDay = now.getDate();
            if (currentDay >= plan.day_of_period) {
                // If it hasn't been executed this month
                if (!lastExec ||
                    lastExec.getMonth() !== now.getMonth() ||
                    lastExec.getFullYear() !== now.getFullYear()) {
                    shouldExecute = true;
                }
            }
        } else if (plan.frequency === "weekly") {
            const currentDayOfWeek = now.getDay() || 7; // 1-7 (Mon-Sun)
            if (currentDayOfWeek >= plan.day_of_period) {
                // If it hasn't been executed this week
                if (!lastExec || (now.getTime() - lastExec.getTime()) > 6 * 24 * 60 * 60 * 1000) {
                    shouldExecute = true;
                }
            }
        }

        if (shouldExecute) {
            // Execute transfer
            const { error: contribError } = await supabase.rpc("contribute_to_savings", {
                p_savings_goal_id: plan.savings_goal_id,
                p_wallet_id: plan.wallet_id,
                p_amount: plan.amount,
                p_date: now.toISOString().split("T")[0],
                p_notes: `Ahorro automático (${plan.frequency})`,
            });

            if (!contribError) {
                // Update last_executed
                await supabase
                    .from("savings_plans")
                    .update({ last_executed: now.toISOString() })
                    .eq("id", plan.id);
            }
        }
    }

    revalidatePath("/savings");
    revalidatePath("/dashboard");
    return { success: true };
}
