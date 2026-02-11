"use server";

import { createClient } from "@/lib/supabase/server";
import type { Category, CategoryType } from "@/lib/database.types";

const DEFAULT_CATEGORIES: { name: string; icon: string; color: string; type: "income" | "expense" }[] = [
    { name: "Comida", icon: "Utensils", color: "#ef4444", type: "expense" },
    { name: "Transporte", icon: "Car", color: "#3b82f6", type: "expense" },
    { name: "Vivienda", icon: "Home", color: "#10b981", type: "expense" },
    { name: "Entretenimiento", icon: "Gamepad2", color: "#8b5cf6", type: "expense" },
    { name: "Salud", icon: "HeartPulse", color: "#f43f5e", type: "expense" },
    { name: "Otros", icon: "DashedIcon", color: "#64748b", type: "expense" },
    { name: "Salario", icon: "Banknote", color: "#22c55e", type: "income" },
    { name: "Ventas", icon: "ShoppingBag", color: "#eab308", type: "income" },
    { name: "Regalos", icon: "Gift", color: "#ec4899", type: "income" },
    { name: "Inversiones", icon: "TrendingUp", color: "#06b6d4", type: "income" },
];

async function ensureDefaultCategories(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string
) {
    const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
    if (existing && existing.length > 0) return;
    await supabase.from("categories").insert(
        DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: userId }))
    );
}

export async function getCategories(type?: CategoryType) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "No autenticado" };

    let query = supabase.from("categories").select("*").eq("user_id", user.id).order("name");
    if (type) query = query.eq("type", type);

    let { data, error } = await query;
    if (error) return { data: [], error: error };

    if (!data || data.length === 0) {
        await ensureDefaultCategories(supabase, user.id);
        let ret = supabase.from("categories").select("*").eq("user_id", user.id).order("name");
        if (type) ret = ret.eq("type", type);
        const res = await ret;
        return { data: (res.data ?? []) as Category[], error: res.error?.message ?? null };
    }
    return { data: data as Category[], error: null };
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
