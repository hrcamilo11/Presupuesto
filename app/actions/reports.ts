"use server";

import { createClient } from "@/lib/supabase/server";

export async function exportMonthlyReport(year: number, month: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const end = new Date(year, month, 0).toISOString().slice(0, 10);

    const [incomesRes, expensesRes] = await Promise.all([
        supabase.from("incomes")
            .select("date, amount, description, income_type, category:categories(name)")
            .gte("date", start)
            .lte("date", end)
            .eq("user_id", user.id),
        supabase.from("expenses")
            .select("date, amount, description, expense_priority, category:categories(name)")
            .gte("date", start)
            .lte("date", end)
            .eq("user_id", user.id)
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
