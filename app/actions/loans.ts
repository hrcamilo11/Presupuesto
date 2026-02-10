"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { loanSchema, loanPaymentSchema } from "@/lib/validations/loan";

export async function createLoan(formData: {
  name: string;
  principal: number;
  annual_interest_rate: number;
  term_months: number;
  start_date: string;
  currency: string;
  description?: string;
  shared_account_id?: string | null;
}) {
  const parsed = loanSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase.from("loans").insert({
    user_id: user.id,
    ...parsed.data,
    description: parsed.data.description || null,
    shared_account_id: formData.shared_account_id || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateLoan(
  id: string,
  formData: { name: string; principal: number; annual_interest_rate: number; term_months: number; start_date: string; currency: string; description?: string }
) {
  const parsed = loanSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("loans")
    .update({ ...parsed.data, description: parsed.data.description || null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteLoan(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const { error } = await supabase.from("loans").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function recordLoanPayment(
  loanId: string,
  formData: { paid_at: string; amount: number; principal_portion: number; interest_portion: number; balance_after: number }
) {
  const parsed = loanPaymentSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const { data: loan } = await supabase.from("loans").select("id").eq("id", loanId).single();
  if (!loan) return { error: "Préstamo no encontrado" };

  const { data: lastPayment } = await supabase
    .from("loan_payments")
    .select("payment_number")
    .eq("loan_id", loanId)
    .order("payment_number", { ascending: false })
    .limit(1)
    .single();
  const paymentNumber = (lastPayment?.payment_number ?? 0) + 1;

  const { error } = await supabase.from("loan_payments").insert({
    loan_id: loanId,
    payment_number: paymentNumber,
    paid_at: parsed.data.paid_at,
    amount: parsed.data.amount,
    principal_portion: parsed.data.principal_portion,
    interest_portion: parsed.data.interest_portion,
    balance_after: parsed.data.balance_after,
  });
  if (error) return { error: error.message };
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  return { error: null };
}
