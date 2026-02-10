"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Budget } from "@/lib/database.types";

export async function getBudgets() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data, error } = await supabase
        .from("budgets")
        .select(`
            *,
            category:categories(*)
        `)
        .eq("user_id", user.id);

    return { data: data as (Budget & { category: { name: string; color: string } })[], error: error?.message };
}

export async function upsertBudget(data: { category_id: string; amount: number; period: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: budget, error } = await supabase
        .from("budgets")
        .upsert({
            ...data,
            user_id: user.id
        }, { onConflict: "user_id,category_id,period" })
        .select()
        .single();

    if (error) return { error: error.message };
    revalidatePath("/budgets");
    revalidatePath("/dashboard");
    return { data: budget as Budget, error: null };
}

export async function deleteBudget(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", id);

    if (error) return { error: error.message };
    revalidatePath("/budgets");
    revalidatePath("/dashboard");
    return { error: null };
}
