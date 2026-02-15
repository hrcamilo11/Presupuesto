"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { IncomeType, Income, Tag } from "@/lib/database.types";
import { incomeSchema } from "@/lib/validations/income";

async function adjustWalletBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  walletId: string | null | undefined,
  delta: number
) {
  if (!walletId || delta === 0) return;
  const { error } = await supabase.rpc("adjust_wallet_balance", {
    p_wallet_id: walletId,
    p_delta: delta,
  });
  if (error) {
    console.error("Error adjusting wallet balance:", error);
  }
}

export async function createIncome(formData: {
  amount: number;
  currency: string;
  income_type: IncomeType;
  description?: string | null;
  date: string;
  category_id?: string | null;
  wallet_id?: string | null;
  shared_account_id?: string | null;
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

  const { data: income, error } = await supabase.from("incomes").insert({
    user_id: user.id,
    amount: formData.amount,
    currency: formData.currency,
    income_type: formData.income_type,
    description: formData.description || null,
    date: formData.date,
    category_id: formData.category_id || null,
    wallet_id: formData.wallet_id || null,
    shared_account_id: formData.shared_account_id || null,
  }).select().single();

  if (error) return { error: error.message };

  // Reflect income in wallet balance
  await adjustWalletBalance(supabase, formData.wallet_id, formData.amount);
  revalidatePath("/incomes");
  revalidatePath("/dashboard");
  return { data: income, error: null };
}

export async function updateIncome(
  id: string,
  formData: {
    amount: number;
    currency: string;
    income_type: IncomeType;
    description?: string | null;
    date: string;
    category_id?: string | null;
    wallet_id?: string | null;
    shared_account_id?: string | null;
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

  // Fetch previous income to adjust wallet balances and preserve shared_account_id
  const { data: previous, error: prevError } = await supabase
    .from("incomes")
    .select("amount, wallet_id, shared_account_id")
    .eq("id", id)
    .single();

  if (prevError) return { error: prevError.message };

  const { data: income, error } = await supabase
    .from("incomes")
    .update({
      amount: formData.amount,
      currency: formData.currency,
      income_type: formData.income_type,
      description: formData.description || null,
      date: formData.date,
      category_id: formData.category_id || null,
      wallet_id: formData.wallet_id || null,
      shared_account_id: formData.shared_account_id ?? previous?.shared_account_id ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  // Revert previous wallet impact, then apply new one
  await adjustWalletBalance(supabase, previous?.wallet_id, -Number(previous?.amount ?? 0));
  await adjustWalletBalance(supabase, formData.wallet_id, formData.amount);
  revalidatePath("/incomes");
  revalidatePath("/dashboard");
  return { data: income, error: null };
}

export async function deleteIncome(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // Fetch income before delete to adjust wallet
  const { data: income, error: prevError } = await supabase
    .from("incomes")
    .select("amount, wallet_id")
    .eq("id", id)
    .single();

  if (prevError) return { error: prevError.message };

  const { error } = await supabase.from("incomes").delete().eq("id", id);

  if (error) return { error: error.message };

  // Remove income from wallet balance
  await adjustWalletBalance(supabase, income?.wallet_id, -Number(income?.amount ?? 0));
  revalidatePath("/incomes");
  revalidatePath("/dashboard");
  return { error: null };
}
export async function getIncomes(sharedAccountId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  let query = supabase.from("incomes").select("*, categories(*), wallet:wallets(*), tags:income_tags(tags(*))");

  if (sharedAccountId) {
    query = query.eq("shared_account_id", sharedAccountId);
  } else {
    query = query.is("shared_account_id", null).eq("user_id", user.id);
  }

  const { data, error } = await query.order("date", { ascending: false });

  // Map the nested tags for easier usage
  const formattedData = data?.map((i) => ({
    ...i,
    tags: (i.tags as unknown as { tags: Tag }[])?.map((t) => t.tags).filter(Boolean) || []
  })) as Income[];

  return { data: formattedData, error: error?.message };
}