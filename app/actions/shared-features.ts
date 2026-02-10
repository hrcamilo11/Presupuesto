"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SharedSavingsGoal } from "@/lib/database.types";

export async function getSharedSavingsGoals(sharedAccountId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("shared_savings_goals")
        .select("*")
        .eq("shared_account_id", sharedAccountId)
        .order("created_at", { ascending: false });

    return { data: data as SharedSavingsGoal[], error: error?.message };
}

export async function upsertSharedSavingsGoal(data: {
    id?: string;
    shared_account_id: string;
    name: string;
    target_amount: number;
    current_amount?: number;
    deadline?: string | null;
    status?: "active" | "completed" | "cancelled";
}) {
    const supabase = await createClient();

    // Check membership first is handled by RLS, but we could add a check here if needed.

    const { data: goal, error } = await supabase
        .from("shared_savings_goals")
        .upsert(data)
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath(`/shared/${data.shared_account_id}`);
    revalidatePath("/dashboard");
    return { data: goal as SharedSavingsGoal, error: null };
}

export async function deleteSharedSavingsGoal(id: string, sharedAccountId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("shared_savings_goals")
        .delete()
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath(`/shared/${sharedAccountId}`);
    return { error: null };
}

// Stats aggregation for shared dashboard
export async function getSharedAccountStats(sharedAccountId: string) {
    const supabase = await createClient();

    // Fetch incomes and expenses in parallel
    const [incomesRes, expensesRes] = await Promise.all([
        supabase.from("incomes").select("amount").eq("shared_account_id", sharedAccountId),
        supabase.from("expenses").select("amount").eq("shared_account_id", sharedAccountId)
    ]);

    const totalIncome = (incomesRes.data ?? []).reduce((sum, i) => sum + Number(i.amount), 0);
    const totalExpense = (expensesRes.data ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

    return {
        data: {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense
        },
        error: incomesRes.error?.message || expensesRes.error?.message || null
    };
}
