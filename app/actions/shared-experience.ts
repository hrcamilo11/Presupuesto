"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- Comments Actions ---

export async function getExpenseComments(expenseId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("expense_comments")
        .select(`
            *,
            user:profiles(full_name)
        `)
        .eq("expense_id", expenseId)
        .order("created_at", { ascending: true });

    return { data, error: error?.message };
}

export async function createExpenseComment(expenseId: string, content: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data, error } = await supabase
        .from("expense_comments")
        .insert({
            expense_id: expenseId,
            user_id: user.id,
            content
        })
        .select()
        .single();

    if (error) return { error: error.message };
    revalidatePath("/expenses");
    return { data, error: null };
}

// --- Member Admin Actions ---

export async function removeMember(sharedAccountId: string, userId: string) {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return { error: "Not authenticated" };

    // Check if current user is owner
    const { data: member } = await supabase
        .from("shared_account_members")
        .select("role")
        .eq("shared_account_id", sharedAccountId)
        .eq("user_id", currentUser.id)
        .single();

    if (member?.role !== "owner") return { error: "Only owners can remove members" };

    const { error } = await supabase
        .from("shared_account_members")
        .delete()
        .eq("shared_account_id", sharedAccountId)
        .eq("user_id", userId);

    if (error) return { error: error.message };
    revalidatePath("/shared");
    return { error: null };
}

export async function transferOwnership(sharedAccountId: string, newOwnerId: string) {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return { error: "Not authenticated" };

    // Start transaction (RPC) for safety?
    // For now, two updates
    const { error: error1 } = await supabase
        .from("shared_account_members")
        .update({ role: "member" })
        .eq("shared_account_id", sharedAccountId)
        .eq("user_id", currentUser.id);

    if (error1) return { error: error1.message };

    const { error: error2 } = await supabase
        .from("shared_account_members")
        .update({ role: "owner" })
        .eq("shared_account_id", sharedAccountId)
        .eq("user_id", newOwnerId);

    if (error2) return { error: error2.message };

    revalidatePath("/shared");
    return { error: null };
}
