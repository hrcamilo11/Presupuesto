"use server";

import { createClient } from "@/lib/supabase/server";
import { INCOME_TYPE_LABELS, EXPENSE_PRIORITY_LABELS } from "@/lib/database.types";
import * as XLSX from "xlsx";

export type ExportSectionId =
  | "balance"
  | "ingresos"
  | "gastos"
  | "suscripciones"
  | "prestamos"
  | "impuestos"
  | "cuentas"
  | "ahorros";

export type ExportToExcelOptions = {
  dateFrom: string;
  dateTo: string;
  sections: ExportSectionId[];
  context?: string | null;
  wallet?: string | null;
};

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

  const totalIncome = incomes.reduce((s: number, i) => s + Number((i as { amount: number }).amount), 0);
  const totalExpense = expenses.reduce((s: number, e) => s + Number((e as { amount: number }).amount), 0);
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

export async function exportToExcel(options: ExportToExcelOptions) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { dateFrom, dateTo, sections, context = null, wallet = null } = options;
  if (!sections.length) return { error: "Selecciona al menos una sección para exportar" };
  if (!dateFrom || !dateTo) return { error: "Indica el rango de fechas" };
  if (dateFrom > dateTo) return { error: "La fecha inicial no puede ser mayor que la final" };

  const wb = XLSX.utils.book_new();

  // Aplica filtro de contexto (personal / cuenta compartida) a consultas que tienen shared_account_id
  const applyContext = <Q extends { is: (col: string, val: null) => Q; eq: (col: string, val: string) => Q }>(q: Q): Q => {
    if (context === "personal") return q.is("shared_account_id", null);
    if (context && context !== "global") return q.eq("shared_account_id", context);
    return q;
  };

  const incomeSelect =
    "id,date,amount,currency,income_type,description,created_at,category:categories(name),wallet:wallets(name),shared_account:shared_accounts(name),income_tags(tags(name))";
  const expenseSelect =
    "id,date,amount,currency,expense_priority,description,created_at,category:categories(name),wallet:wallets(name),shared_account:shared_accounts(name),expense_tags(tags(name))";

  if (sections.includes("balance") || sections.includes("ingresos") || sections.includes("gastos")) {
    let incomeQuery = supabase
      .from("incomes")
      .select(incomeSelect)
      .gte("date", dateFrom)
      .lte("date", dateTo)
      .order("date", { ascending: false });
    let expenseQuery = supabase
      .from("expenses")
      .select(expenseSelect)
      .gte("date", dateFrom)
      .lte("date", dateTo)
      .order("date", { ascending: false });
    incomeQuery = applyContext(incomeQuery);
    expenseQuery = applyContext(expenseQuery);
    if (wallet) {
      incomeQuery = incomeQuery.eq("wallet_id", wallet);
      expenseQuery = expenseQuery.eq("wallet_id", wallet);
    }
    const [incomesRes, expensesRes] = await Promise.all([incomeQuery, expenseQuery]);
    const incomes = (incomesRes.data ?? []) as unknown[];
    const expenses = (expensesRes.data ?? []) as unknown[];
    const totalIncome = incomes.reduce((s: number, i: unknown) => s + Number((i as { amount: number }).amount), 0);
    const totalExpense = expenses.reduce((s: number, e: unknown) => s + Number((e as { amount: number }).amount), 0);
    const balance = totalIncome - totalExpense;

    if (sections.includes("balance")) {
      const rows: (string | number)[][] = [
        ["Reporte de balance", ""],
        ["Periodo", `${dateFrom} a ${dateTo}`],
        [],
        ["Total ingresos", totalIncome],
        ["Total gastos", totalExpense],
        ["Balance", balance],
        ["Cantidad ingresos", incomes.length],
        ["Cantidad gastos", expenses.length],
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Balance");
    }

    if (sections.includes("ingresos")) {
      const header = [
        "Id", "Fecha", "Monto", "Moneda", "Tipo ingreso", "Categoría", "Cuenta", "Cuenta compartida",
        "Descripción", "Etiquetas", "Fecha de registro",
      ];
      const rows: (string | number)[][] = [header];
      for (const i of incomes) {
        const row = i as {
          id: string; date: string; amount: number; currency: string; income_type: string;
          description?: string | null; created_at: string; category?: unknown; wallet?: unknown;
          shared_account?: unknown; income_tags?: unknown[];
        };
        rows.push([
          row.id, row.date, row.amount, row.currency,
          INCOME_TYPE_LABELS[row.income_type as keyof typeof INCOME_TYPE_LABELS] ?? row.income_type,
          nameOf(row.category) || "Sin categoría", nameOf(row.wallet), nameOf(row.shared_account),
          row.description ?? "", tagsNames(row.income_tags ?? []), row.created_at,
        ]);
      }
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Ingresos");
    }

    if (sections.includes("gastos")) {
      const header = [
        "Id", "Fecha", "Monto", "Moneda", "Prioridad", "Categoría", "Cuenta", "Cuenta compartida",
        "Descripción", "Etiquetas", "Fecha de registro",
      ];
      const rows: (string | number)[][] = [header];
      for (const e of expenses) {
        const row = e as {
          id: string; date: string; amount: number; currency: string; expense_priority: string;
          description?: string | null; created_at: string; category?: unknown; wallet?: unknown;
          shared_account?: unknown; expense_tags?: unknown[];
        };
        rows.push([
          row.id, row.date, row.amount, row.currency,
          EXPENSE_PRIORITY_LABELS[row.expense_priority as keyof typeof EXPENSE_PRIORITY_LABELS] ?? row.expense_priority,
          nameOf(row.category) || "Sin categoría", nameOf(row.wallet), nameOf(row.shared_account),
          row.description ?? "", tagsNames(row.expense_tags ?? []), row.created_at,
        ]);
      }
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Gastos");
    }
  }

  if (sections.includes("suscripciones")) {
    let q = supabase.from("subscriptions").select("name, amount, currency, frequency, next_due_date, description, shared_account:shared_accounts(name)").order("next_due_date", { ascending: true });
    q = applyContext(q);
    const { data: subs } = await q;
    const rows: (string | number)[][] = [
      ["Nombre", "Monto", "Moneda", "Frecuencia", "Próxima fecha", "Descripción", "Cuenta compartida"],
      ...(subs ?? []).map((s: { name: string; amount: number; currency: string; frequency: string; next_due_date: string; description?: string | null; shared_account?: unknown }) => [
        s.name, s.amount, s.currency, s.frequency === "monthly" ? "Mensual" : "Anual", s.next_due_date ?? "", s.description ?? "", nameOf(s.shared_account),
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Suscripciones");
  }

  if (sections.includes("prestamos")) {
    let q = supabase.from("loans").select("id, name, principal, annual_interest_rate, term_months, start_date, currency, description, shared_account:shared_accounts(name)").order("created_at", { ascending: false });
    q = applyContext(q);
    const { data: loans } = await q;
    const loanIds = (loans ?? []).map((l: { id: string }) => l.id);
    const { data: paymentsByLoan } = loanIds.length
      ? await supabase.from("loan_payments").select("loan_id, payment_number, paid_at, amount, balance_after").in("loan_id", loanIds).order("paid_at", { ascending: false })
      : { data: [] as { loan_id: string; payment_number: number; paid_at: string; amount: number; balance_after: number }[] };
    const lastPaymentByLoan = (paymentsByLoan ?? []).reduce((acc: Record<string, { payment_number: number; paid_at: string; amount: number; balance_after: number }>, p) => {
      if (!acc[p.loan_id]) acc[p.loan_id] = p;
      return acc;
    }, {});
    const rows: (string | number)[][] = [
      ["Nombre", "Capital", "Tasa %", "Plazo (meses)", "Fecha inicio", "Moneda", "Descripción", "Cuenta compartida", "Pagos realizados", "Último pago", "Saldo restante"],
      ...(loans ?? []).map((l: { id: string; name: string; principal: number; annual_interest_rate: number; term_months: number; start_date: string; currency: string; description?: string | null; shared_account?: unknown }) => {
        const last = lastPaymentByLoan[l.id];
        const payCount = (paymentsByLoan ?? []).filter((p: { loan_id: string }) => p.loan_id === l.id).length;
        return [
          l.name, l.principal, l.annual_interest_rate, l.term_months, l.start_date, l.currency,
          l.description ?? "", nameOf(l.shared_account),
          payCount, last ? last.paid_at : "", last ? last.balance_after : l.principal,
        ];
      }),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Prestamos");
  }

  if (sections.includes("impuestos")) {
    let q = supabase.from("tax_obligations").select("name, amount, currency, period_type, due_date, paid_at, notes, shared_account:shared_accounts(name)").order("due_date", { ascending: true });
    q = applyContext(q);
    const { data: taxes } = await q;
    const rows: (string | number)[][] = [
      ["Nombre", "Monto", "Moneda", "Periodo", "Vencimiento", "Pagado", "Notas", "Cuenta compartida"],
      ...(taxes ?? []).map((t: { name: string; amount: number; currency: string; period_type: string; due_date: string; paid_at?: string | null; notes?: string | null; shared_account?: unknown }) => [
        t.name, t.amount, t.currency, t.period_type === "monthly" ? "Mensual" : t.period_type === "quarterly" ? "Trimestral" : "Anual",
        t.due_date, t.paid_at ? "Sí" : "No", t.notes ?? "", nameOf(t.shared_account),
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Impuestos");
  }

  if (sections.includes("cuentas")) {
    const { data: wallets } = await supabase.from("wallets").select("name, type, currency, balance, credit_limit").eq("user_id", user.id).order("created_at", { ascending: true });
    const rows: (string | number)[][] = [
      ["Nombre", "Tipo", "Moneda", "Balance", "Límite de crédito"],
      ...(wallets ?? []).map((w: { name: string; type: string; currency: string; balance: number; credit_limit?: number | null }) =>
        [w.name, w.type, w.currency, w.balance, w.credit_limit ?? ""]
      ),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Cuentas");
  }

  if (sections.includes("ahorros")) {
    let q = supabase.from("savings_goals").select("name, target_amount, current_amount, target_date, type, shared_account:shared_accounts(name)").order("created_at", { ascending: false });
    q = applyContext(q);
    const { data: goals } = await q;
    const rows: (string | number)[][] = [
      ["Nombre", "Meta", "Actual", "Progreso %", "Fecha meta", "Tipo", "Cuenta compartida"],
      ...(goals ?? []).map((g: { name: string; target_amount: number; current_amount: number; target_date?: string | null; type?: string | null; shared_account?: unknown }) => {
        const pct = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0;
        return [g.name, g.target_amount, g.current_amount, `${pct}%`, g.target_date ?? "", g.type ?? "", nameOf(g.shared_account)];
      }),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Ahorros");
  }

  const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  return { data: base64, error: null };
}
