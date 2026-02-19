"use server";

import { createClient } from "@/lib/supabase/server";
import { INCOME_TYPE_LABELS, EXPENSE_PRIORITY_LABELS } from "@/lib/database.types";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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

interface IncomeRow {
  id: string;
  date: string;
  amount: number;
  currency: string;
  income_type: string;
  description: string | null;
  created_at: string;
  category: { name: string } | { name: string }[] | null;
  wallet: { name: string } | { name: string }[] | null;
  shared_account: { name: string } | { name: string }[] | null;
  income_tags: { tags: { name: string } | { name: string }[] }[];
}

interface ExpenseRow {
  id: string;
  date: string;
  amount: number;
  currency: string;
  expense_priority: string;
  description: string | null;
  created_at: string;
  category: { name: string } | { name: string }[] | null;
  wallet: { name: string } | { name: string }[] | null;
  shared_account: { name: string } | { name: string }[] | null;
  expense_tags: { tags: { name: string } | { name: string }[] }[];
}

function escapeCsv(value: string): string {
  const s = String(value ?? "").replace(/"/g, '""');
  return s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r") ? `"${s}"` : s;
}

function csvRow(fields: (string | number | null | undefined)[]): string {
  return fields.map((f) => escapeCsv(f == null ? "" : String(f))).join(",");
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

  const incomes = (incomesRes.data ?? []) as unknown[];
  const expenses = (expensesRes.data ?? []) as unknown[];

  const totalIncome = incomes.reduce((s: number, i) => s + Number((i as { amount: number }).amount), 0);
  const totalExpense = expenses.reduce((s: number, e) => s + Number((e as { amount: number }).amount), 0);
  const balance = totalIncome - totalExpense;
  const periodLabel = `${year}-${String(month).padStart(2, "0")}`;

  const lines: string[] = [];
  const bom = "\uFEFF";

  lines.push(csvRow(["Reporte mensual Presupuesto", periodLabel]));
  lines.push(csvRow(["Total ingresos", "Total gastos", "Balance", "Cant. ingresos", "Cant. gastos"]));
  lines.push(csvRow([totalIncome, totalExpense, balance, incomes.length, expenses.length]));
  lines.push("");

  lines.push("Ingresos");
  lines.push(
    csvRow([
      "Id", "Fecha", "Monto", "Moneda", "Tipo ingreso", "Categoría", "Cuenta", "Cuenta compartida",
      "Descripción", "Etiquetas", "Fecha de registro",
    ])
  );
  for (const i of (incomes as unknown[])) {
    const row = i as IncomeRow;
    const catName = nameOf(row.category) || "Sin categoría";
    const tagsStr = tagsNames(row.income_tags ?? []);
    lines.push(
      csvRow([
        row.id, row.date, row.amount, row.currency,
        INCOME_TYPE_LABELS[row.income_type as keyof typeof INCOME_TYPE_LABELS] ?? row.income_type,
        catName, nameOf(row.wallet), nameOf(row.shared_account),
        row.description ?? "", tagsStr, row.created_at,
      ])
    );
  }
  lines.push("");

  lines.push("Gastos");
  lines.push(
    csvRow([
      "Id", "Fecha", "Monto", "Moneda", "Prioridad", "Categoría", "Cuenta", "Cuenta compartida",
      "Descripción", "Etiquetas", "Fecha de registro",
    ])
  );
  for (const e of (expenses as unknown[])) {
    const row = e as ExpenseRow;
    const catName = nameOf(row.category) || "Sin categoría";
    const tagsStr = tagsNames(row.expense_tags ?? []);
    lines.push(
      csvRow([
        row.id, row.date, row.amount, row.currency,
        EXPENSE_PRIORITY_LABELS[row.expense_priority as keyof typeof EXPENSE_PRIORITY_LABELS] ?? row.expense_priority,
        catName, nameOf(row.wallet), nameOf(row.shared_account),
        row.description ?? "", tagsStr, row.created_at,
      ])
    );
  }

  const csvContent = bom + lines.join("\r\n");
  return { data: csvContent, error: null };
}

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
    const incomes = (incomesRes.data ?? []) as unknown[] as IncomeRow[];
    const expenses = (expensesRes.data ?? []) as unknown[] as ExpenseRow[];
    const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
    const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
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
        rows.push([
          i.id, i.date, i.amount, i.currency,
          INCOME_TYPE_LABELS[i.income_type as keyof typeof INCOME_TYPE_LABELS] ?? i.income_type,
          nameOf(i.category) || "Sin categoría", nameOf(i.wallet), nameOf(i.shared_account),
          i.description ?? "", tagsNames(i.income_tags ?? []), i.created_at,
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
        rows.push([
          e.id, e.date, e.amount, e.currency,
          EXPENSE_PRIORITY_LABELS[e.expense_priority as keyof typeof EXPENSE_PRIORITY_LABELS] ?? e.expense_priority,
          nameOf(e.category) || "Sin categoría", nameOf(e.wallet), nameOf(e.shared_account),
          e.description ?? "", tagsNames(e.expense_tags ?? []), e.created_at,
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
      ...(subs ?? []).map((s) => [
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
    const loanIds = (loans ?? []).map((l) => l.id);
    const { data: paymentsByLoan } = loanIds.length
      ? await supabase.from("loan_payments").select("loan_id, payment_number, paid_at, amount, balance_after").in("loan_id", loanIds).order("paid_at", { ascending: false })
      : { data: [] as { loan_id: string; paid_at: string; balance_after: number }[] };

    const lastPaymentByLoan = (paymentsByLoan ?? []).reduce((acc: Record<string, { loan_id: string; paid_at: string; balance_after: number }>, p) => {
      if (!acc[p.loan_id]) acc[p.loan_id] = p;
      return acc;
    }, {});

    const rows: (string | number)[][] = [
      ["Nombre", "Capital", "Tasa %", "Plazo (meses)", "Fecha inicio", "Moneda", "Descripción", "Cuenta compartida", "Pagos realizados", "Último pago", "Saldo restante"],
      ...(loans ?? []).map((l) => {
        const last = lastPaymentByLoan[l.id];
        const payCount = (paymentsByLoan ?? []).filter((p) => p.loan_id === l.id).length;
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
      ...(taxes ?? []).map((t) => [
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
      ...(wallets ?? []).map((w) =>
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
      ...(goals ?? []).map((g) => {
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

export async function exportToPdf(options: ExportToExcelOptions) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { dateFrom, dateTo, sections, context = null, wallet = null } = options;
  if (!sections.length) return { error: "Selecciona al menos una sección para exportar" };
  if (!dateFrom || !dateTo) return { error: "Indica el rango de fechas" };

  const doc = new jsPDF();
  const title = "Reporte de Presupuesto";
  const period = `Periodo: ${dateFrom} a ${dateTo}`;

  let yPos = 20;
  doc.setFontSize(20);
  doc.text(title, 14, yPos);
  yPos += 10;
  doc.setFontSize(12);
  doc.text(period, 14, yPos);
  yPos += 10;

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
    const incomes = (incomesRes.data ?? []) as IncomeRow[];
    const expenses = (expensesRes.data ?? []) as ExpenseRow[];
    const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
    const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const balance = totalIncome - totalExpense;

    if (sections.includes("balance")) {
      doc.setFontSize(16);
      doc.text("Resumen de Balance", 14, yPos);
      yPos += 5;
      autoTable(doc, {
        startY: yPos,
        head: [["Concepto", "Valor"]],
        body: [
          ["Total Ingresos", String(totalIncome)],
          ["Total Gastos", String(totalExpense)],
          ["Balance Neto", String(balance)],
          ["Cant. Movimientos", String(incomes.length + expenses.length)],
        ],
        theme: "striped",
      });
      yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    }

    if (sections.includes("ingresos")) {
      if (yPos > 250) { doc.addPage(); yPos = 20; }
      doc.setFontSize(16);
      doc.text("Detalle de Ingresos", 14, yPos);
      yPos += 5;
      autoTable(doc, {
        startY: yPos,
        head: [["Fecha", "Monto", "Tipo", "Categoría", "Cuenta"]],
        body: incomes.map(i => [
          i.date,
          String(i.amount),
          INCOME_TYPE_LABELS[i.income_type as keyof typeof INCOME_TYPE_LABELS] ?? i.income_type,
          nameOf(i.category) || "N/A",
          nameOf(i.wallet) || "N/A",
        ]),
      });
      yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    }

    if (sections.includes("gastos")) {
      if (yPos > 250) { doc.addPage(); yPos = 20; }
      doc.setFontSize(16);
      doc.text("Detalle de Gastos", 14, yPos);
      yPos += 5;
      autoTable(doc, {
        startY: yPos,
        head: [["Fecha", "Monto", "Prioridad", "Categoría", "Cuenta"]],
        body: expenses.map(e => [
          e.date,
          String(e.amount),
          EXPENSE_PRIORITY_LABELS[e.expense_priority as keyof typeof EXPENSE_PRIORITY_LABELS] ?? e.expense_priority,
          nameOf(e.category) || "N/A",
          nameOf(e.wallet) || "N/A",
        ]),
      });
      yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    }
  }

  if (sections.includes("suscripciones")) {
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    let q = supabase.from("subscriptions").select("name, amount, frequency, next_due_date");
    q = applyContext(q);
    const { data: subs } = await q;
    doc.setFontSize(16);
    doc.text("Suscripciones", 14, yPos);
    yPos += 5;
    autoTable(doc, {
      startY: yPos,
      head: [["Nombre", "Monto", "Frecuencia", "Vencimiento"]],
      body: (subs ?? []).map(s => [
        s.name,
        String(s.amount),
        s.frequency === "monthly" ? "Mensual" : "Anual",
        s.next_due_date || "N/A",
      ]),
    });
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  const pdfBase64 = doc.output("datauristring").split(",")[1];
  return { data: pdfBase64, error: null };
}
