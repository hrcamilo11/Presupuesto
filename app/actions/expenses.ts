"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ExpensePriority } from "@/lib/database.types";
import { expenseSchema } from "@/lib/validations/expense";

export async function createExpense(formData: {
  amount: number;
  currency: string;
  expense_priority: ExpensePriority;
  description?: string | null;
  date: string;
  category_id?: string | null;
  wallet_id?: string | null;
  shared_account_id?: string | null;
}) {
  const parsed = expenseSchema.safeParse(formData);
  if (!parsed.success) {
    const msg =
      parsed.error.issues.map((i) => i.message).join(" ") || "Datos inválidos";
    return { error: msg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: expense, error } = await supabase.from("expenses").insert({
    user_id: user.id,
    amount: formData.amount,
    currency: formData.currency,
    expense_priority: formData.expense_priority,
    description: formData.description || null,
    date: formData.date,
    category_id: formData.category_id || null,
    wallet_id: formData.wallet_id || null,
    shared_account_id: formData.shared_account_id || null,
  }).select().single();

  if (error) return { error: error.message };
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { data: expense, error: null };
}

export async function updateExpense(
  id: string,
  formData: {
    amount: number;
    currency: string;
    expense_priority: ExpensePriority;
    description?: string | null;
    date: string;
    category_id?: string | null;
    wallet_id?: string | null;
    shared_account_id?: string | null;
  }
) {
  const parsed = expenseSchema.safeParse(formData);
  if (!parsed.success) {
    const msg =
      parsed.error.issues.map((i) => i.message).join(" ") || "Datos inválidos";
    return { error: msg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: expense, error } = await supabase
    .from("expenses")
    .update({
      amount: formData.amount,
      currency: formData.currency,
      expense_priority: formData.expense_priority,
      description: formData.description || null,
      date: formData.date,
      category_id: formData.category_id || null,
      wallet_id: formData.wallet_id || null,
    })
    .eq("id", id).select().single();

  if (error) return { error: error.message };
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { data: expense, error: null };
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { error: null };
}
export async function getExpenses(sharedAccountId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  let query = supabase.from("expenses").select("*, categories(*), wallet:wallets(*), tags:expense_tags(tags(*))");

  if (sharedAccountId) {
    query = query.eq("shared_account_id", sharedAccountId);
  } else {
    query = query.is("shared_account_id", null).eq("user_id", user.id);
  }

  const { data, error } = await query.order("date", { ascending: false });

  // Map the nested tags for easier usage
  const formattedData = data?.map((e: any) => ({
    ...e,
    tags: e.tags?.map((t: any) => t.tags).filter(Boolean) || []
  }));

  return { data: formattedData, error: error?.message };
}
