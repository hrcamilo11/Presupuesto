"use server";

import { createClient } from "@/lib/supabase/server";
import type { Category, CategoryType } from "@/lib/database.types";

export async function getCategories(type?: CategoryType) {
    const supabase = await createClient();
    let query = supabase.from("categories").select("*").order("name");

    if (type) {
        query = query.eq("type", type);
    }

    const { data, error } = await query;
    return { data: data as Category[], error: error?.message };
}

export async function createCategory(data: Omit<Category, "id" | "user_id" | "created_at" | "updated_at">) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No authenticated user" };

    const { data: category, error } = await supabase
        .from("categories")
        .insert({
            ...data,
            user_id: user.id
        })
        .select()
        .single();

    return { data: category as Category, error: error?.message };
}

export async function updateCategory(id: string, data: Partial<Omit<Category, "id" | "user_id">>) {
    const supabase = await createClient();
    const { data: category, error } = await supabase
        .from("categories")
        .update(data)
        .eq("id", id)
        .select()
        .single();

    return { data: category as Category, error: error?.message };
}

export async function deleteCategory(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

    return { error: error?.message };
}
