"use server";

import { createClient } from "@/lib/supabase/server";

export async function exportMonthlyReport(
    year: number,
    month: number,
    options?: { context?: string | null; wallet?: string | null }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const end = new Date(year, month, 0).toISOString().slice(0, 10);
    const context = options?.context ?? null;
    const wallet = options?.wallet ?? null;

    let incomeQuery = supabase
        .from("incomes")
        .select("date, amount, description, income_type, category:categories(name)")
        .gte("date", start)
        .lte("date", end);
    let expenseQuery = supabase
        .from("expenses")
        .select("date, amount, description, expense_priority, category:categories(name)")
        .gte("date", start)
        .lte("date", end);

    if (context === "personal") {
        incomeQuery = incomeQuery.is("shared_account_id", null);
        expenseQuery = expenseQuery.is("shared_account_id", null);
    } else if (context && context !== "global") {
        incomeQuery = incomeQuery.eq("shared_account_id", context);
        expenseQuery = expenseQuery.eq("shared_account_id", context);
    }
    if (wallet) {
        incomeQuery = incomeQuery.eq("wallet_id", wallet);
        expenseQuery = expenseQuery.eq("wallet_id", wallet);
    }

    const [incomesRes, expensesRes] = await Promise.all([
        incomeQuery,
        expenseQuery
    ]);

    const incomes = (incomesRes.data ?? []).map(i => ({
        date: i.date,
        type: "Ingreso",
        amount: i.amount,
        category: (i.category as unknown as { name: string })?.name || "Sin categoría",
        description: i.description || ""
    }));

    const expenses = (expensesRes.data ?? []).map(e => ({
        date: e.date,
        type: "Gasto",
        amount: -e.amount,
        category: (e.category as unknown as { name: string })?.name || "Sin categoría",
        description: e.description || ""
    }));

    const allTransactions = [...incomes, ...expenses].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Generate CSV string
    const headers = ["Fecha", "Tipo", "Monto", "Categoría", "Descripción"];
    const csvContent = [
        headers.join(","),
        ...allTransactions.map(t =>
            [t.date, t.type, t.amount, `"${t.category}"`, `"${t.description.replace(/"/g, '""')}"`].join(",")
        )
    ].join("\n");

    return { data: csvContent, error: null };
}
