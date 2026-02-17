"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TaxPeriodType } from "@/lib/database.types";
import { taxObligationSchema } from "@/lib/validations/tax";

export async function createTaxObligation(formData: {
  name: string;
  amount: number;
  currency: string;
  period_type: TaxPeriodType;
  due_date: string;
  paid_at?: string;
  notes?: string;
  shared_account_id?: string | null;
}) {
  const parsed = taxObligationSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase.from("tax_obligations").insert({
    user_id: user.id,
    name: parsed.data.name,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    period_type: parsed.data.period_type,
    due_date: parsed.data.due_date,
    paid_at: parsed.data.paid_at || null,
    notes: parsed.data.notes || null,
    shared_account_id: formData.shared_account_id || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/taxes");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateTaxObligation(
  id: string,
  formData: { name: string; amount: number; currency: string; period_type: TaxPeriodType; due_date: string; paid_at?: string; notes?: string }
) {
  const parsed = taxObligationSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("tax_obligations")
    .update({
      name: parsed.data.name,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      period_type: parsed.data.period_type,
      due_date: parsed.data.due_date,
      paid_at: parsed.data.paid_at || null,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/taxes");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteTaxObligation(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const { error } = await supabase.from("tax_obligations").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/taxes");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function markTaxPaid(id: string, walletId: string, paidAt: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: tax } = await supabase
    .from("tax_obligations")
    .select("name, amount, currency, shared_account_id")
    .eq("id", id)
    .single();

  if (!tax) return { error: "Obligación tributaria no encontrada" };

  // 1. Update tax obligation
  const { error: taxError } = await supabase
    .from("tax_obligations")
    .update({ paid_at: paidAt, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (taxError) return { error: taxError.message };

  // 2. Create expense
  const { error: expenseError } = await supabase.from("expenses").insert({
    user_id: user.id,
    amount: tax.amount,
    currency: tax.currency,
    expense_priority: "obligatory",
    description: `Pago impuesto: ${tax.name}`,
    date: paidAt,
    category_id: null,
    wallet_id: walletId,
    shared_account_id: tax.shared_account_id,
  });

  if (expenseError) return { error: expenseError.message };

  // 3. Adjust wallet balance
  const { error: balanceError } = await supabase.rpc("adjust_wallet_balance", {
    p_wallet_id: walletId,
    p_delta: -tax.amount,
  });

  if (balanceError) return { error: balanceError.message };

  revalidatePath("/taxes");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { error: null };
}
