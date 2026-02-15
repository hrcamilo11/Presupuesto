"use server";

import { createClient } from "@/lib/supabase/server";
import { INCOME_TYPE_LABELS, EXPENSE_PRIORITY_LABELS } from "@/lib/database.types";

function escapeCsv(value: string): string {
  const s = String(value ?? "").replace(/"/g, '""');
  return s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r") ? `"${s}"` : s;
}

function csvRow(fields: (string | number | null | undefined)[]): string {
  return fields.map((f) => escapeCsv(f == null ? "" : String(f))).join(",");
}

export async function exportMonthlyReport(
  year: number,
  month: number,
  options?: { context?: string | null; wallet?: string | null }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  const context = options?.context ?? null;
  const wallet = options?.wallet ?? null;

  const incomeSelect =
    "id,date,amount,currency,income_type,description,created_at,category:categories(name),wallet:wallets(name),shared_account:shared_accounts(name),income_tags(tags(name))";
  const expenseSelect =
    "id,date,amount,currency,expense_priority,description,created_at,category:categories(name),wallet:wallets(name),shared_account:shared_accounts(name),expense_tags(tags(name))";

  let incomeQuery = supabase
    .from("incomes")
    .select(incomeSelect)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });
  let expenseQuery = supabase
    .from("expenses")
    .select(expenseSelect)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });

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

  const [incomesRes, expensesRes] = await Promise.all([incomeQuery, expenseQuery]);

  // Supabase puede devolver relaciones como objeto o como array según la versión
  const nameOf = (v: unknown): string =>
    Array.isArray(v) ? (v[0] as { name?: string } | undefined)?.name ?? "" : (v as { name?: string } | null)?.name ?? "";
  const tagsNames = (arr: unknown[]): string =>
    (arr ?? [])
      .map((x) => {
        const t = (x as { tags?: unknown }).tags;
        const n = Array.isArray(t) ? (t[0] as { name?: string })?.name : (t as { name?: string })?.name;
        return n ?? "";
      })
      .filter(Boolean)
      .join("; ");

  const incomes = (incomesRes.data ?? []) as unknown[];
  const expenses = (expensesRes.data ?? []) as unknown[];

  const totalIncome = incomes.reduce((s, i) => s + Number((i as { amount: number }).amount), 0);
  const totalExpense = expenses.reduce((s, e) => s + Number((e as { amount: number }).amount), 0);
  const balance = totalIncome - totalExpense;
  const periodLabel = `${year}-${String(month).padStart(2, "0")}`;

  const lines: string[] = [];

  // BOM para Excel UTF-8
  const bom = "\uFEFF";

  // Resumen
  lines.push(csvRow(["Reporte mensual Presupuesto", periodLabel]));
  lines.push(csvRow(["Total ingresos", "Total gastos", "Balance", "Cant. ingresos", "Cant. gastos"]));
  lines.push(csvRow([totalIncome, totalExpense, balance, incomes.length, expenses.length]));
  lines.push("");

  // Ingresos
  lines.push("Ingresos");
  lines.push(
    csvRow([
      "Id",
      "Fecha",
      "Monto",
      "Moneda",
      "Tipo ingreso",
      "Categoría",
      "Cuenta",
      "Cuenta compartida",
      "Descripción",
      "Etiquetas",
      "Fecha de registro",
    ])
  );
  for (const i of incomes) {
    const row = i as {
      id: string;
      date: string;
      amount: number;
      currency: string;
      income_type: string;
      description?: string | null;
      created_at: string;
      category?: unknown;
      wallet?: unknown;
      shared_account?: unknown;
      income_tags?: unknown[];
    };
    const catName = nameOf(row.category) || "Sin categoría";
    const tagsStr = tagsNames(row.income_tags ?? []);
    lines.push(
      csvRow([
        row.id,
        row.date,
        row.amount,
        row.currency,
        INCOME_TYPE_LABELS[row.income_type as keyof typeof INCOME_TYPE_LABELS] ?? row.income_type,
        catName,
        nameOf(row.wallet),
        nameOf(row.shared_account),
        row.description ?? "",
        tagsStr,
        row.created_at,
      ])
    );
  }
  lines.push("");

  // Gastos
  lines.push("Gastos");
  lines.push(
    csvRow([
      "Id",
      "Fecha",
      "Monto",
      "Moneda",
      "Prioridad",
      "Categoría",
      "Cuenta",
      "Cuenta compartida",
      "Descripción",
      "Etiquetas",
      "Fecha de registro",
    ])
  );
  for (const e of expenses) {
    const row = e as {
      id: string;
      date: string;
      amount: number;
      currency: string;
      expense_priority: string;
      description?: string | null;
      created_at: string;
      category?: unknown;
      wallet?: unknown;
      shared_account?: unknown;
      expense_tags?: unknown[];
    };
    const catName = nameOf(row.category) || "Sin categoría";
    const tagsStr = tagsNames(row.expense_tags ?? []);
    lines.push(
      csvRow([
        row.id,
        row.date,
        row.amount,
        row.currency,
        EXPENSE_PRIORITY_LABELS[row.expense_priority as keyof typeof EXPENSE_PRIORITY_LABELS] ?? row.expense_priority,
        catName,
        nameOf(row.wallet),
        nameOf(row.shared_account),
        row.description ?? "",
        tagsStr,
        row.created_at,
      ])
    );
  }

  const csvContent = bom + lines.join("\r\n");
  return { data: csvContent, error: null };
}
