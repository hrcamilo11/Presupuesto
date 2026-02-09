"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { IncomeType } from "@/lib/database.types";
import { incomeSchema } from "@/lib/validations/income";

export async function createIncome(formData: {
  amount: number;
  currency: string;
  income_type: IncomeType;
  description?: string;
  date: string;
}) {
  const parsed = incomeSchema.safeParse(formData);
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

  const { error } = await supabase.from("incomes").insert({
    user_id: user.id,
    amount: formData.amount,
    currency: formData.currency,
    income_type: formData.income_type,
    description: formData.description || null,
    date: formData.date,
  });

  if (error) return { error: error.message };
  revalidatePath("/incomes");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateIncome(
  id: string,
  formData: {
    amount: number;
    currency: string;
    income_type: IncomeType;
    description?: string;
    date: string;
  }
) {
  const parsed = incomeSchema.safeParse(formData);
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
    .from("incomes")
    .update({
      amount: formData.amount,
      currency: formData.currency,
      income_type: formData.income_type,
      description: formData.description || null,
      date: formData.date,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/incomes");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteIncome(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("incomes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/incomes");
  revalidatePath("/dashboard");
  return { error: null };
}
