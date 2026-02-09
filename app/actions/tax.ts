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
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/taxes");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteTaxObligation(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const { error } = await supabase.from("tax_obligations").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/taxes");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function markTaxPaid(id: string, paidAt: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const { error } = await supabase
    .from("tax_obligations")
    .update({ paid_at: paidAt, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/taxes");
  revalidatePath("/dashboard");
  return { error: null };
}
