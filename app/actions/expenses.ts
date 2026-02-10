"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ExpensePriority } from "@/lib/database.types";
import { expenseSchema } from "@/lib/validations/expense";

export async function createExpense(formData: {
  amount: number;
  currency: string;
  expense_priority: ExpensePriority;
  description?: string;
  date: string;
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

  const { error } = await supabase.from("expenses").insert({
    user_id: user.id,
    amount: formData.amount,
    currency: formData.currency,
    expense_priority: formData.expense_priority,
    description: formData.description || null,
    date: formData.date,
    shared_account_id: formData.shared_account_id || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateExpense(
  id: string,
  formData: {
    amount: number;
    currency: string;
    expense_priority: ExpensePriority;
    description?: string;
    date: string;
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

  const { error } = await supabase
    .from("expenses")
    .update({
      amount: formData.amount,
      currency: formData.currency,
      expense_priority: formData.expense_priority,
      description: formData.description || null,
      date: formData.date,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { error: null };
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
