"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Budget } from "@/lib/database.types";

export async function upsertBudget(data: {
    id?: string;
    category_id: string;
    amount: number;
    period: string;
    shared_account_id?: string | null;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No authenticated user" };

    const { data: budget, error } = await supabase
        .from("budgets")
        .upsert({
            ...data,
            user_id: user.id
        })
        .select()
        .single();

    if (error) return { error: error.message };

    revalidatePath("/budgets");
    if (data.shared_account_id) {
        revalidatePath(`/shared/${data.shared_account_id}`);
    }
    return { data: budget as Budget, error: null };
}

export async function getBudgets(sharedAccountId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No authenticated user" };

    let query = supabase.from("budgets").select("*, categories(*)");

    if (sharedAccountId) {
        query = query.eq("shared_account_id", sharedAccountId);
    } else {
        query = query.is("shared_account_id", null).eq("user_id", user.id);
    }

    const { data, error } = await query;
    return { data, error: error?.message };
}
export async function deleteBudget(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No authenticated user" };

    const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/budgets");
    return { error: null };
}
