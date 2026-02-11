"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Tag } from "@/lib/database.types";

const DEFAULT_TAGS: { name: string; color: string }[] = [
    { name: "Urgente", color: "#ef4444" },
    { name: "Reembolsable", color: "#22c55e" },
    { name: "Trabajo", color: "#3b82f6" },
    { name: "Personal", color: "#8b5cf6" },
    { name: "Hogar", color: "#f97316" },
    { name: "Ocio", color: "#ec4899" },
];

async function ensureDefaultTags(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string
) {
    const { data: existing } = await supabase
        .from("tags")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
    if (existing && existing.length > 0) return;
    await supabase.from("tags").insert(
        DEFAULT_TAGS.map((t) => ({ ...t, user_id: userId }))
    );
}

export async function getTags() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "No autenticado" };

    const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

    if (error) return { data: [], error: error.message };
    if (!data || data.length === 0) {
        await ensureDefaultTags(supabase, user.id);
        const ret = await supabase
            .from("tags")
            .select("*")
            .eq("user_id", user.id)
            .order("name");
        return { data: (ret.data ?? []) as Tag[], error: ret.error?.message ?? null };
    }
    return { data: data as Tag[], error: null };
}

export async function createTag(name: string, color: string = "#3b82f6") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data, error } = await supabase
        .from("tags")
        .insert({
            user_id: user.id,
            name,
            color
        })
        .select()
        .single();

    if (error) return { error: error.message };
    revalidatePath("/tags");
    return { data: data as Tag, error: null };
}

export async function updateTag(id: string, data: { name?: string; color?: string }) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("tags")
        .update(data)
        .eq("id", id);

    if (error) return { error: error.message };
    revalidatePath("/tags");
    return { error: null };
}

export async function deleteTag(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", id);

    if (error) return { error: error.message };
    revalidatePath("/tags");
    revalidatePath("/expenses");
    revalidatePath("/incomes");
    return { error: null };
}

export async function setTransactionTags(transactionId: string, tagIds: string[], type: "expense" | "income") {
    const supabase = await createClient();
    const table = type === "expense" ? "expense_tags" : "income_tags";
    const fk = type === "expense" ? "expense_id" : "income_id";

    // 1. Delete existing
    const { error: delError } = await supabase
        .from(table)
        .delete()
        .eq(fk, transactionId);

    if (delError) return { error: delError.message };

    // 2. Insert new
    if (tagIds.length > 0) {
        const inserts = tagIds.map(tagId => ({
            [fk]: transactionId,
            tag_id: tagId
        }));

        const { error: insError } = await supabase
            .from(table)
            .insert(inserts);

        if (insError) return { error: insError.message };
    }

    revalidatePath(`/${type}s`);
    return { error: null };
}
