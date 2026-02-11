"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ExpensePriority, Expense, Tag } from "@/lib/database.types";
import { expenseSchema } from "@/lib/validations/expense";
import { createNotification } from "@/app/actions/notifications";

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
    console.error("Error adjusting wallet balance (expense):", error);
  }
}

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

  // Reflect expense in wallet balance (subtract)
  await adjustWalletBalance(supabase, formData.wallet_id, -formData.amount);

  if (expense.category_id) {
    const y = formData.date.slice(0, 4);
    const m = formData.date.slice(5, 7);
    const monthStart = `${y}-${m}-01`;
    const lastDay = new Date(Number(y), Number(m), 0).getDate();
    const monthEnd = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
    const { data: budgets } = await supabase
      .from("budgets")
      .select("id, amount, categories(name)")
      .eq("user_id", user.id)
      .eq("category_id", expense.category_id)
      .in("period", ["monthly", `${y}-${m}`]);
    if (budgets?.length) {
      const { data: monthExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", user.id)
        .eq("category_id", expense.category_id)
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .is("shared_account_id", null);
      const total = (monthExpenses ?? []).reduce((s, r) => s + Number(r.amount), 0);
      for (const b of budgets) {
        const limit = Number(b.amount);
        const categoryName = (b.categories as { name?: string } | null)?.name ?? "Categoría";
        if (total > limit) {
          await createNotification({
            userId: user.id,
            title: "Presupuesto superado",
            body: `Has superado el presupuesto de ${categoryName} este periodo (${total.toLocaleString()} de ${limit.toLocaleString()}).`,
            type: "budget",
            link: "/budgets",
          });
          break;
        }
        if (total >= limit * 0.8) {
          await createNotification({
            userId: user.id,
            title: "Presupuesto al 80%",
            body: `Has usado el 80% del presupuesto de ${categoryName} (${total.toLocaleString()} de ${limit.toLocaleString()}).`,
            type: "budget",
            link: "/budgets",
          });
          break;
        }
      }
    }
  }

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

  // Fetch previous expense
  const { data: previous, error: prevError } = await supabase
    .from("expenses")
    .select("amount, wallet_id")
    .eq("id", id)
    .single();

  if (prevError) return { error: prevError.message };

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
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  // Revert old amount, apply new one
  await adjustWalletBalance(supabase, previous?.wallet_id, Number(previous?.amount ?? 0));
  await adjustWalletBalance(supabase, formData.wallet_id, -formData.amount);
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

  // Fetch expense before delete
  const { data: expense, error: prevError } = await supabase
    .from("expenses")
    .select("amount, wallet_id")
    .eq("id", id)
    .single();

  if (prevError) return { error: prevError.message };

  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) return { error: error.message };

  // Add back amount to wallet balance
  await adjustWalletBalance(supabase, expense?.wallet_id, Number(expense?.amount ?? 0));
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
  const formattedData = data?.map((e) => ({
    ...e,
    tags: (e.tags as unknown as { tags: Tag }[])?.map((t) => t.tags).filter(Boolean) || []
  })) as Expense[];

  return { data: formattedData, error: error?.message };
}