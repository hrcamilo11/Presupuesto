/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  INCOME_TYPE_LABELS,
  EXPENSE_PRIORITY_LABELS,
  type IncomeType,
  type ExpensePriority,
  type Category,
  type Tag,
} from "@/lib/database.types";
import { IncomePieChart } from "@/components/dashboard/income-pie-chart";
import { ExpensePieChart } from "@/components/dashboard/expense-pie-chart";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { BalanceRing } from "@/components/dashboard/balance-ring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowRight } from "lucide-react";
import { DashboardSummaryBanner } from "@/components/dashboard/dashboard-summary-banner";
import { WalletFilter } from "@/components/dashboard/wallet-filter";
import { BudgetSummary } from "@/components/dashboard/budget-summary";
import { ExportReportDialog } from "@/components/dashboard/export-report-dialog";
import { DashboardContextSelector } from "@/components/dashboard/dashboard-context-selector";
import { FilterBar, FilterField } from "@/components/ui/filter-bar";
import { getBudgets } from "@/app/actions/budgets";
import { getMySharedAccounts } from "@/app/actions/shared-accounts";
import { formatNumber } from "@/lib/utils";
import { getCategories } from "@/app/actions/categories";
import { DistributionSection } from "@/components/dashboard/distribution-section";

const DEFAULT_DASHBOARD_SETTINGS = {
  show_summary_cards: true,
  show_budget_summary: true,
  show_accounts_preview: true,
  show_savings_goals: true,
  show_trend_chart: true,
  show_pie_charts: true,
  show_quick_access: true,
  show_distribution_section: true,
  show_debts_section: true,
};

const DEFAULT_SECTIONS_ORDER = [
  "summary_cards",
  "investments_summary",
  "savings_totals",
  "budgets_accounts_savings",
  "ring_trend",
  "debts_section",
  "pie_charts",
  "distribution_section",
  "quick_access",
] as const;

const MONTHS_ES_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTHS_ES_LONG = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function getMonthBounds(monthOffset: number) {
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth() + monthOffset;
  const base = new Date(Date.UTC(utcYear, utcMonth, 1));
  const start = base.toISOString().slice(0, 10);
  const endDate = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0));
  const end = endDate.toISOString().slice(0, 10);
  const label = `${MONTHS_ES_SHORT[base.getUTCMonth()]} '${String(base.getUTCFullYear()).slice(-2)}`;
  return { start, end, label };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { wallet?: string; context?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load profile settings to drive defaults and dashboard customization
  const { data: profile } = await supabase
    .from("profiles")
    .select("dashboard_settings, default_dashboard_context, default_wallet_id")
    .eq("id", user.id)
    .single();

  const dashboardSettings: any = {
    ...DEFAULT_DASHBOARD_SETTINGS,
    ...(profile?.dashboard_settings ?? {}),
  };
  const sectionsOrder: string[] =
    (dashboardSettings.sections_order as string[] | undefined) ?? [...DEFAULT_SECTIONS_ORDER];

  // Process any pending recurring savings fallback
  const { processRecurringSavings } = await import("@/app/actions/savings");
  await processRecurringSavings();

  // Recordatorios de vencimiento (suscripciones, impuestos, préstamos)
  const { createDueReminders } = await import("@/app/actions/notifications");
  createDueReminders().catch(() => { });

  // Apply defaults (only when user didn't choose a filter yet)
  const hasWalletParam = typeof searchParams.wallet === "string" && searchParams.wallet.length > 0;
  const hasContextParam = typeof searchParams.context === "string" && searchParams.context.length > 0;
  const defaultWalletId = profile?.default_wallet_id || null;
  const defaultContext = profile?.default_dashboard_context || "global";

  if (!hasWalletParam && !hasContextParam && (defaultWalletId || (defaultContext && defaultContext !== "global"))) {
    const params = new URLSearchParams();
    if (defaultContext && defaultContext !== "global") params.set("context", defaultContext);
    if (defaultWalletId) params.set("wallet", defaultWalletId);
    redirect(`/dashboard?${params.toString()}`);
  }

  const selectedWalletId = searchParams.wallet;
  const context = searchParams.context || "global";
  const { start, end } = getMonthBounds(0);
  const now = new Date();
  const monthName = `${MONTHS_ES_LONG[now.getUTCMonth()]} ${now.getUTCFullYear()}`;

  // Base queries
  let incomeQuery = supabase
    .from("incomes")
    .select("amount, income_type, category_id, wallet_id, tags:income_tags(tags(*))")
    .gte("date", start)
    .lte("date", end);
  let expenseQuery = supabase
    .from("expenses")
    .select("amount, expense_priority, category_id, wallet_id, subscription_id, loan_payment_id, tags:expense_tags(tags(*))")
    .gte("date", start)
    .lte("date", end);

  if (selectedWalletId) {
    incomeQuery = incomeQuery.eq("wallet_id", selectedWalletId);
    expenseQuery = expenseQuery.eq("wallet_id", selectedWalletId);
  }

  if (context === "personal") {
    incomeQuery = incomeQuery.is("shared_account_id", null);
    expenseQuery = expenseQuery.is("shared_account_id", null);
  } else if (context !== "global") {
    incomeQuery = incomeQuery.eq("shared_account_id", context);
    expenseQuery = expenseQuery.eq("shared_account_id", context);
  }

  let subscriptionsQuery = supabase.from("subscriptions").select("amount, frequency, next_due_date");
  let taxQuery = supabase.from("tax_obligations").select("amount, paid_at");
  let loansQuery = supabase.from("loans").select("id, principal, currency");
  if (context === "personal") {
    subscriptionsQuery = subscriptionsQuery.is("shared_account_id", null);
    taxQuery = taxQuery.is("shared_account_id", null);
    loansQuery = loansQuery.is("shared_account_id", null);
  } else if (context !== "global") {
    subscriptionsQuery = subscriptionsQuery.eq("shared_account_id", context);
    taxQuery = taxQuery.eq("shared_account_id", context);
    loansQuery = loansQuery.eq("shared_account_id", context);
  }

  const budgetsSharedId = context === "global" || context === "personal" ? undefined : context;
  const [{ data: budgetsData }, { data: sharedAccountsData }] = await Promise.all([
    getBudgets(budgetsSharedId),
    getMySharedAccounts(),
  ]);

  const [
    incomesRes,
    expensesRes,
    subscriptionsRes,
    taxRes,
    walletsRes,
    savingsRes,
    sharedSavingsRes,
    categoriesRes,
    savingsTxRes,
    sharedSavingsTxRes,
    loansRes,
    loanPaymentsRes,
    trendIncomes,
    trendExpenses,
  ] = await Promise.all([
    incomeQuery,
    expenseQuery,
    subscriptionsQuery,
    taxQuery,
    supabase.from("wallets").select("*").order("balance", { ascending: false }),
    supabase.from("savings_goals").select("*").order("target_date", { ascending: true }),
    supabase.from("shared_savings_goals").select("*").order("created_at", { ascending: false }),
    getCategories(),
    supabase
      .from("savings_transactions")
      .select("amount, wallet_id, date")
      .gte("date", start)
      .lte("date", end),
    supabase
      .from("shared_savings_transactions")
      .select("amount, wallet_id, date, shared_savings_goal_id")
      .gte("date", start)
      .lte("date", end),
    loansQuery,
    supabase
      .from("loan_payments")
      .select("loan_id, payment_number, balance_after"),
    Promise.all(
      [0, -1, -2, -3, -4, -5].map(async (offset) => {
        const { start: s, end: e, label } = getMonthBounds(offset);
        let q = supabase.from("incomes").select("amount").gte("date", s).lte("date", e);
        if (selectedWalletId) q = q.eq("wallet_id", selectedWalletId);
        if (context === "personal") q = q.is("shared_account_id", null);
        else if (context !== "global") q = q.eq("shared_account_id", context);
        const { data } = await q;
        const total = (data ?? []).reduce((sum, i) => sum + Number(i.amount), 0);
        return { label, total };
      })
    ),
    Promise.all(
      [0, -1, -2, -3, -4, -5].map(async (offset) => {
        const { start: s, end: e } = getMonthBounds(offset);
        let q = supabase.from("expenses").select("amount").gte("date", s).lte("date", e);
        if (selectedWalletId) q = q.eq("wallet_id", selectedWalletId);
        if (context === "personal") q = q.is("shared_account_id", null);
        else if (context !== "global") q = q.eq("shared_account_id", context);
        const { data } = await q;
        const total = (data ?? []).reduce((sum, i) => sum + Number(i.amount), 0);
        return total;
      })
    ),
  ]);

  const incomes = (incomesRes.data ?? []) as any[];
  const expenses = (expensesRes.data ?? []) as any[];
  const subscriptions = (subscriptionsRes.data ?? []) as any[];
  const taxObligations = (taxRes.data ?? []) as any[];
  const wallets = (walletsRes.data ?? []) as any[];
  const savingsGoals = (savingsRes.data ?? []) as any[];
  const sharedSavingsGoals = (sharedSavingsRes.data ?? []) as any[];
  const budgets = (budgetsData ?? []) as any[];
  const sharedAccounts = (sharedAccountsData ?? []) as any[];
  const categories = (categoriesRes.data ?? []) as Category[];
  const savingsTransactions = (savingsTxRes.data ?? []) as any[];
  const sharedSavingsTransactions = (sharedSavingsTxRes.data ?? []) as any[];
  const loans = (loansRes.data ?? []) as any[];
  const loanPayments = (loanPaymentsRes.data ?? []) as any[];

  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

  const totalPersonalSavings = savingsGoals.reduce(
    (s, g) => s + Number(g.current_amount ?? 0),
    0
  );

  // Filtrar metas y datos de ahorro compartido según el contexto actual
  const sharedAccountIds = new Set(sharedAccounts.map((a: any) => a.id));
  const sharedSavingsGoalsInContext =
    context === "personal"
      ? []
      : context === "global"
        ? sharedSavingsGoals.filter((g: any) => !g.shared_account_id || sharedAccountIds.has(g.shared_account_id))
        : sharedSavingsGoals.filter((g: any) => g.shared_account_id === context);

  const totalSharedSavings = sharedSavingsGoalsInContext.reduce(
    (s: number, g: any) => s + Number(g.current_amount ?? 0),
    0
  );

  const sharedGoalIdsInContext = new Set(sharedSavingsGoalsInContext.map((g: any) => g.id));
  const sharedSavingsTransactionsInContext = sharedSavingsTransactions.filter(
    (tx: any) => tx.shared_savings_goal_id && sharedGoalIdsInContext.has(tx.shared_savings_goal_id)
  );

  const subscriptionsMonthly = subscriptions.reduce((s, sub) => {
    const amt = Number(sub.amount);
    return s + (sub.frequency === "yearly" ? amt / 12 : amt);
  }, 0);
  const taxPending = taxObligations.filter(t => !t.paid_at).reduce((s, t) => s + Number(t.amount), 0);

  // Deudas
  // 1) Préstamos: saldo restante usando último pago registrado o principal si no hay pagos
  const remainingByLoan = new Map<string, number>();
  loans.forEach((loan: any) => {
    remainingByLoan.set(loan.id, Number(loan.principal ?? 0));
  });
  loanPayments.forEach((p: any) => {
    const current = remainingByLoan.get(p.loan_id);
    if (current === undefined) return;
    // Usamos el mayor payment_number como saldo actual
    const existingPayment = loanPayments
      .filter((x: any) => x.loan_id === p.loan_id)
      .reduce((max, cur) => (cur.payment_number > max.payment_number ? cur : max), p);
    remainingByLoan.set(p.loan_id, Number(existingPayment.balance_after ?? 0));
  });
  const totalLoansDebt = Array.from(remainingByLoan.values()).reduce((s, v) => s + v, 0);

  // 2) Tarjetas de crédito: sumamos balances de wallets tipo "credit"
  const totalCreditCardsDebt = wallets
    .filter((w: any) => w.type === "credit")
    .reduce((s, w) => s + Math.max(0, Number(w.balance ?? 0)), 0);

  // 3) Suscripciones del mes: suma de montos con vencimiento en el mes actual
  const subscriptionsDueThisMonth = subscriptions.filter((s: any) => {
    const d = String(s.next_due_date);
    return d >= start && d <= end;
  });
  const subscriptionsDueAmount = subscriptionsDueThisMonth.reduce(
    (s, sub) => s + Number(sub.amount ?? 0),
    0,
  );

  const byIncomeType = incomes.reduce(
    (acc: Record<IncomeType, number>, i: any) => {
      const t = i.income_type as IncomeType;
      acc[t] = (acc[t] ?? 0) + Number(i.amount);
      return acc;
    },
    { monthly: 0, irregular: 0, occasional: 0 }
  );
  const byExpensePriority = expenses.reduce(
    (acc: Record<ExpensePriority, number>, e: any) => {
      const p = e.expense_priority as ExpensePriority;
      acc[p] = (acc[p] ?? 0) + Number(e.amount);
      return acc;
    },
    { obligatory: 0, necessary: 0, optional: 0 }
  );

  const trendData = (trendIncomes as any[]).map((m, idx) => ({
    month: m.label,
    ingresos: m.total,
    gastos: (trendExpenses as number[])[idx] ?? 0,
    balance: m.total - ((trendExpenses as number[])[idx] ?? 0),
  })).reverse();
  // Distribución por categoría: se trabaja por NOMBRE de categoría / tipo de salida
  type CategoryAgg = { name: string; income: number; expense: number };
  const categoryAggMap = new Map<string, CategoryAgg>();
  const categoryById = new Map<string, Category>();
  categories.forEach((c) => categoryById.set(c.id, c));

  const addToCategory = (name: string, kind: "income" | "expense", amount: number) => {
    if (!amount) return;
    const current = categoryAggMap.get(name) ?? { name, income: 0, expense: 0 };
    if (kind === "income") current.income += amount;
    else current.expense += amount;
    categoryAggMap.set(name, current);
  };

  incomes.forEach((i: any) => {
    const cat =
      (i.category_id && categoryById.get(i.category_id)) || null;
    const name = cat?.name || "Sin categoría (ingresos)";
    addToCategory(name, "income", Number(i.amount ?? 0));
  });

  expenses.forEach((e: any) => {
    const cat =
      (e.category_id && categoryById.get(e.category_id)) || null;
    let name: string;
    if (cat) {
      name = cat.name;
    } else if (e.subscription_id) {
      name = "Suscripciones";
    } else if (e.loan_payment_id) {
      name = "Préstamos";
    } else {
      name = "Sin categoría (gastos)";
    }
    addToCategory(name, "expense", Number(e.amount ?? 0));
  });

  // Contribuciones a ahorros: se consideran una categoría extra de gasto (solo las del contexto actual)
  savingsTransactions.forEach((tx: any) => {
    addToCategory("Ahorro personal", "expense", Number(tx.amount ?? 0));
  });
  sharedSavingsTransactionsInContext.forEach((tx: any) => {
    addToCategory("Ahorro grupal", "expense", Number(tx.amount ?? 0));
  });

  const categoryDistribution = Array.from(categoryAggMap.values())
    .filter((c) => c.income > 0 || c.expense > 0)
    .sort((a, b) => b.income + b.expense - (a.income + a.expense));

  // Distribución por etiqueta
  const tagMap = new Map<string, { tag: Tag; income: number; expense: number }>();

  const extractTags = (raw: any): Tag[] => {
    const nested = raw?.tags as unknown as { tags: Tag }[] | undefined;
    if (!nested) return [];
    return nested.map((t) => t.tags).filter(Boolean) as Tag[];
  };

  incomes.forEach((i: any) => {
    const tags = extractTags(i);
    tags.forEach((t) => {
      const current = tagMap.get(t.id) ?? { tag: t, income: 0, expense: 0 };
      current.income += Number(i.amount ?? 0);
      tagMap.set(t.id, current);
    });
  });

  expenses.forEach((e: any) => {
    const tags = extractTags(e);
    tags.forEach((t) => {
      const current = tagMap.get(t.id) ?? { tag: t, income: 0, expense: 0 };
      current.expense += Number(e.amount ?? 0);
      tagMap.set(t.id, current);
    });
  });

  const tagDistribution = Array.from(tagMap.values())
    .map((entry) => ({
      name: entry.tag.name,
      income: entry.income,
      expense: entry.expense,
    }))
    .filter((t) => t.income > 0 || t.expense > 0)
    .sort((a, b) => b.income + b.expense - (a.income + a.expense));

  // Distribución por cuenta (wallet)
  type AccountAgg = { name: string; income: number; expense: number };
  const accountMap = new Map<string, AccountAgg>();

  const getOrCreateAccount = (walletId: string | null | undefined): AccountAgg => {
    if (!walletId) {
      const key = "none";
      if (!accountMap.has(key)) {
        accountMap.set(key, {
          name: "Sin cuenta asignada",
          income: 0,
          expense: 0,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return accountMap.get(key)!;
    }
    const existing = accountMap.get(walletId);
    if (existing) return existing;
    const wallet = wallets.find((w: any) => w.id === walletId);
    const name = wallet ? wallet.name : "Cuenta desconocida";
    const created: AccountAgg = { name, income: 0, expense: 0 };
    accountMap.set(walletId, created);
    return created;
  };

  incomes.forEach((i: any) => {
    const entry = getOrCreateAccount(i.wallet_id ?? null);
    entry.income += Number(i.amount ?? 0);
  });

  expenses.forEach((e: any) => {
    const entry = getOrCreateAccount(e.wallet_id ?? null);
    entry.expense += Number(e.amount ?? 0);
  });

  // Tratamos las contribuciones a ahorros como salidas adicionales por cuenta (solo las del contexto actual)
  savingsTransactions.forEach((tx: any) => {
    const entry = getOrCreateAccount(tx.wallet_id ?? null);
    entry.expense += Number(tx.amount ?? 0);
  });

  sharedSavingsTransactionsInContext.forEach((tx: any) => {
    const entry = getOrCreateAccount(tx.wallet_id ?? null);
    entry.expense += Number(tx.amount ?? 0);
  });

  const accountsDistribution = Array.from(accountMap.values()).filter(
    (a) => a.income > 0 || a.expense > 0,
  );

  function renderSection(sectionId: string) {
    const investmentWallets = wallets.filter((w: any) => w.type === "investment");
    const totalInvested = investmentWallets.reduce((s: number, w: any) => s + Number(w.balance ?? 0), 0);
    const estimatedMonthlyGains = investmentWallets.reduce((s: number, w: any) => {
      const balance = Number(w.balance ?? 0);
      const yieldRate = Number(w.investment_yield_rate ?? 0);
      if (balance <= 0 || yieldRate <= 0) return s;
      return s + (balance * (yieldRate / 100) / 12);
    }, 0);

    switch (sectionId) {
      case "investments_summary":
        if (investmentWallets.length === 0) return null;
        return (
          <section className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Card className="card-hover flex min-h-[100px] flex-col justify-between overflow-hidden border-blue-500/20 bg-blue-500/5 shadow-sm sm:min-h-[110px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 sm:pb-2 sm:pt-6">
                <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                  Total Invertido
                </CardTitle>
                <TrendingUp className="h-4 w-4 shrink-0 text-blue-600" />
              </CardHeader>
              <CardContent className="pb-4 pt-0 sm:pb-6 sm:pt-0">
                <p className="truncate text-lg font-bold text-blue-600 dark:text-blue-400 sm:text-2xl">
                  {formatNumber(totalInvested)}
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover flex min-h-[100px] flex-col justify-between overflow-hidden border-cyan-500/20 bg-cyan-500/5 shadow-sm sm:min-h-[110px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 sm:pb-2 sm:pt-6">
                <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                  Rendimiento Est. Mes
                </CardTitle>
                <TrendingUp className="h-4 w-4 shrink-0 text-cyan-600" />
              </CardHeader>
              <CardContent className="pb-4 pt-0 sm:pb-6 sm:pt-0">
                <p className="truncate text-lg font-bold text-cyan-600 dark:text-cyan-400 sm:text-2xl">
                  {formatNumber(estimatedMonthlyGains)}
                </p>
              </CardContent>
            </Card>
          </section>
        );
      case "summary_cards":
        if (dashboardSettings.show_summary_cards === false) return null;
        return (
          <section className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Card className="card-hover flex min-h-[100px] flex-col justify-between overflow-hidden border-green-500/20 bg-green-500/5 shadow-sm sm:min-h-[110px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 sm:pb-2 sm:pt-6">
                <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                  Ingresos
                </CardTitle>
                <TrendingUp className="h-4 w-4 shrink-0 text-green-600" />
              </CardHeader>
              <CardContent className="pb-4 pt-0 sm:pb-6 sm:pt-0">
                <p className="truncate text-lg font-bold text-green-600 dark:text-green-400 sm:text-2xl">
                  {formatNumber(totalIncome)}
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover flex min-h-[100px] flex-col justify-between overflow-hidden border-red-500/20 bg-red-500/5 shadow-sm sm:min-h-[110px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 sm:pb-2 sm:pt-6">
                <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                  Gastos
                </CardTitle>
                <TrendingDown className="h-4 w-4 shrink-0 text-red-600" />
              </CardHeader>
              <CardContent className="pb-4 pt-0 sm:pb-6 sm:pt-0">
                <p className="truncate text-lg font-bold text-red-600 dark:text-red-400 sm:text-2xl">
                  {formatNumber(totalExpense)}
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover flex min-h-[100px] flex-col justify-between overflow-hidden border-primary/20 bg-primary/5 shadow-sm sm:min-h-[110px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 sm:pb-2 sm:pt-6">
                <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                  Balance
                </CardTitle>
                <Wallet className="h-4 w-4 shrink-0 text-primary" />
              </CardHeader>
              <CardContent className="pb-4 pt-0 sm:pb-6 sm:pt-0">
                <p
                  className={`truncate text-lg font-bold sm:text-2xl ${balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}
                >
                  {formatNumber(balance)}
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover flex min-h-[100px] flex-col justify-between overflow-hidden border-amber-500/20 bg-amber-500/5 shadow-sm sm:min-h-[110px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 sm:pb-2 sm:pt-6">
                <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                  Tasa ahorro
                </CardTitle>
                <PiggyBank className="h-4 w-4 shrink-0 text-amber-600" />
              </CardHeader>
              <CardContent className="pb-4 pt-0 sm:pb-6 sm:pt-0">
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400 sm:text-2xl">
                  {savingsRate}%
                </p>
              </CardContent>
            </Card>
          </section>
        );
      case "savings_totals":
        return (
          <section className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {(context === "personal" || context === "global") && (
              <Card className="card-hover flex min-h-[100px] flex-col justify-between overflow-hidden border-emerald-500/20 bg-emerald-500/5 shadow-sm sm:min-h-[110px]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 sm:pb-2 sm:pt-6">
                  <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Ahorro personal
                  </CardTitle>
                  <PiggyBank className="h-4 w-4 shrink-0 text-emerald-600" />
                </CardHeader>
                <CardContent className="pb-4 pt-0 sm:pb-6 sm:pt-0">
                  <p className="truncate text-lg font-bold text-emerald-600 dark:text-emerald-400 sm:text-2xl">
                    {formatNumber(totalPersonalSavings)}
                  </p>
                </CardContent>
              </Card>
            )}

            {context !== "personal" && (
              <Card className="card-hover flex min-h-[100px] flex-col justify-between overflow-hidden border-sky-500/20 bg-sky-500/5 shadow-sm sm:min-h-[110px]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 sm:pb-2 sm:pt-6">
                  <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Ahorro grupal
                  </CardTitle>
                  <Wallet className="h-4 w-4 shrink-0 text-sky-600" />
                </CardHeader>
                <CardContent className="pb-4 pt-0 sm:pb-6 sm:pt-0">
                  <p className="truncate text-lg font-bold text-sky-600 dark:text-sky-400 sm:text-2xl">
                    {formatNumber(totalSharedSavings)}
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        );
      case "budgets_accounts_savings":
        return (
          <section className="grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboardSettings.show_budget_summary !== false && (
              <BudgetSummary budgets={budgets} expenses={expenses} />
            )}

            {dashboardSettings.show_accounts_preview !== false && !selectedWalletId && (
              <Card className="card-hover shadow-sm lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-2">
                  <CardTitle className="text-base sm:text-lg">Mis Cuentas</CardTitle>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/wallets" className="gap-1">
                      Ver todas <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wallets.slice(0, 3).map((w) => (
                      <div
                        key={w.id}
                        className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm truncate">{w.name}</span>
                          <span className="text-xs text-muted-foreground uppercase">{w.currency}</span>
                        </div>
                        <div className="text-xl font-bold">{formatNumber(Number(w.balance))}</div>
                        <div className="text-xs text-muted-foreground mt-1 capitalize">
                          {w.type === "debit"
                            ? "Débito"
                            : w.type === "credit"
                              ? "Crédito"
                              : w.type === "cash"
                                ? "Efectivo"
                                : w.type}
                        </div>
                      </div>
                    ))}
                    {wallets.length === 0 && (
                      <div className="col-span-full text-center py-4 text-muted-foreground text-sm">
                        No tienes cuentas registradas.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {dashboardSettings.show_savings_goals !== false && (
              <Card className="card-hover shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-2">
                  <CardTitle className="text-base sm:text-lg">Metas de Ahorro</CardTitle>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/savings" className="gap-1">
                      Ver todas <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="space-y-4">
                    {savingsGoals.slice(0, 3).map((g) => {
                      const progress =
                        g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
                      return (
                        <div key={g.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium truncate">{g.name}</span>
                            <span className="text-muted-foreground">
                              {formatNumber(Number(g.current_amount))} /{" "}
                              {formatNumber(Number(g.target_amount))}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {savingsGoals.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No tienes metas de ahorro.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </section>
        );
      case "ring_trend":
        return (
          <section className="grid min-w-0 gap-4 md:gap-6 lg:grid-cols-3">
            <Card className="card-hover flex min-w-0 flex-col items-center justify-center shadow-sm p-4 sm:p-6">
              <CardHeader className="w-full min-w-0 p-0 pb-2">
                <CardTitle className="text-center text-sm font-medium">
                  Ingresos vs gastos
                </CardTitle>
              </CardHeader>
              <BalanceRing
                balance={balance}
                totalIncome={totalIncome}
                totalExpense={totalExpense}
              />
            </Card>
            {dashboardSettings.show_trend_chart !== false && (
              <Card className="card-hover min-w-0 overflow-hidden shadow-sm lg:col-span-2">
                <CardHeader className="p-4 pb-0 sm:p-6 sm:pb-0">
                  <CardTitle className="text-base sm:text-lg">Tendencia (6 meses)</CardTitle>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Ingresos y gastos por mes
                  </p>
                </CardHeader>
                <CardContent className="min-w-0 overflow-hidden p-4 pt-2 sm:p-6 sm:pt-2">
                  <TrendChart data={trendData} />
                </CardContent>
              </Card>
            )}
          </section>
        );
      case "debts_section": {
        if (dashboardSettings.show_debts_section === false) return null;
        const isSharedContext = context !== "global" && context !== "personal";
        return (
          <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            <Card className="card-hover min-w-0 overflow-hidden border-amber-500/20 bg-amber-500/5 shadow-sm">
              <CardHeader className="space-y-1 pb-2 pt-4 sm:pb-3 sm:pt-6">
                <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                  Préstamos
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 pt-0 sm:pb-6">
                <p className="truncate text-lg font-bold text-amber-700 dark:text-amber-400 sm:text-2xl">
                  {formatNumber(totalLoansDebt)}
                </p>
              </CardContent>
            </Card>

            {!isSharedContext && (
              <Card className="card-hover overflow-hidden border-red-500/20 bg-red-500/5 shadow-sm">
                <CardHeader className="space-y-1 pb-2 pt-4 sm:pb-3 sm:pt-6">
                  <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Tarjetas de crédito
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 pt-0 sm:pb-6">
                  <p className="truncate text-lg font-bold text-red-700 dark:text-red-400 sm:text-2xl">
                    {formatNumber(totalCreditCardsDebt)}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="card-hover overflow-hidden border-purple-500/20 bg-purple-500/5 shadow-sm">
              <CardHeader className="space-y-1 pb-2 pt-4 sm:pb-3 sm:pt-6">
                <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                  Suscripciones del mes
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 pt-0 sm:pb-6">
                <p className="truncate text-lg font-bold text-purple-700 dark:text-purple-400 sm:text-2xl">
                  {formatNumber(subscriptionsDueAmount)}
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover overflow-hidden border-sky-500/20 bg-sky-500/5 shadow-sm">
              <CardHeader className="space-y-1 pb-2 pt-4 sm:pb-3 sm:pt-6">
                <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                  Impuestos pendientes
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 pt-0 sm:pb-6">
                <p className="truncate text-lg font-bold text-sky-700 dark:text-sky-400 sm:text-2xl">
                  {formatNumber(taxPending)}
                </p>
              </CardContent>
            </Card>
          </section>
        );
      }
      case "pie_charts":
        if (dashboardSettings.show_pie_charts === false) return null;
        return (
          <section className="grid min-w-0 gap-4 md:grid-cols-2 md:gap-6">
            <Card className="card-hover min-w-0 overflow-hidden shadow-sm">
              <CardHeader className="flex min-w-0 flex-row flex-wrap items-center justify-between gap-2 p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Ingresos por tipo</CardTitle>
                <Button asChild variant="ghost" size="sm" className="shrink-0">
                  <Link href="/incomes" className="gap-1">
                    Ver todo <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="min-w-0 overflow-hidden p-4 pt-0 sm:p-6 sm:pt-0">
                <IncomePieChart data={byIncomeType} />
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground sm:text-sm">
                  {(Object.entries(byIncomeType) as [IncomeType, number][]).map(
                    ([type, amount]) => (
                      <li key={type} className="flex justify-between gap-2">
                        <span className="truncate">{INCOME_TYPE_LABELS[type]}</span>
                        <span className="shrink-0 tabular-nums">${formatNumber(amount)}</span>
                      </li>
                    )
                  )}
                </ul>
              </CardContent>
            </Card>
            <Card className="card-hover min-w-0 overflow-hidden shadow-sm">
              <CardHeader className="flex min-w-0 flex-row flex-wrap items-center justify-between gap-2 p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Gastos por prioridad</CardTitle>
                <Button asChild variant="ghost" size="sm" className="shrink-0">
                  <Link href="/expenses" className="gap-1">
                    Ver todo <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="min-w-0 overflow-hidden p-4 pt-0 sm:p-6 sm:pt-0">
                <ExpensePieChart data={byExpensePriority} />
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground sm:text-sm">
                  {(Object.entries(byExpensePriority) as [ExpensePriority, number][]).map(
                    ([priority, amount]) => (
                      <li key={priority} className="flex justify-between gap-2">
                        <span className="truncate">
                          {EXPENSE_PRIORITY_LABELS[priority]}
                        </span>
                        <span className="shrink-0 tabular-nums">${formatNumber(amount)}</span>
                      </li>
                    )
                  )}
                </ul>
              </CardContent>
            </Card>
          </section>
        );
      case "distribution_section":
        if (dashboardSettings.show_distribution_section === false) return null;
        return (
          <div className="min-w-0">
            <DistributionSection
              categories={categoryDistribution}
              tags={tagDistribution}
              accounts={accountsDistribution}
            />
          </div>
        );
      case "quick_access":
        if (dashboardSettings.show_quick_access === false) return null;
        return (
          <section className="min-w-0">
            <h2 className="mb-3 text-base font-semibold sm:text-lg">Accesos rápidos</h2>
            <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <Button
                asChild
                variant="outline"
                className="h-auto min-h-[72px] w-full flex-col gap-1 py-3 sm:min-h-0 sm:py-4"
              >
                <Link href="/incomes" className="flex flex-col items-center gap-1">
                  <TrendingUp className="h-5 w-5 shrink-0" />
                  <span className="text-center text-sm font-medium sm:text-base">
                    Agregar ingreso
                  </span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto min-h-[72px] w-full flex-col gap-1 py-3 sm:min-h-0 sm:py-4"
              >
                <Link href="/expenses" className="flex flex-col items-center gap-1">
                  <TrendingDown className="h-5 w-5 shrink-0" />
                  <span className="text-center text-sm font-medium sm:text-base">
                    Agregar gasto
                  </span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto min-h-[72px] w-full flex-col gap-1 py-3 sm:min-h-0 sm:py-4"
              >
                <Link href="/subscriptions" className="flex flex-col items-center gap-1">
                  <span className="text-base font-semibold tabular-nums sm:text-lg">
                    ${formatNumber(subscriptionsMonthly)}
                  </span>
                  <span className="text-center text-xs text-muted-foreground">
                    Suscripciones / mes
                  </span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto min-h-[72px] w-full flex-col gap-1 py-3 sm:min-h-0 sm:py-4"
              >
                <Link href="/taxes" className="flex flex-col items-center gap-1">
                  <span className="text-base font-semibold tabular-nums text-amber-600 sm:text-lg">
                    ${formatNumber(taxPending)}
                  </span>
                  <span className="text-center text-xs text-muted-foreground">
                    Impuestos pendientes
                  </span>
                </Link>
              </Button>
            </div>
          </section>
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-w-0 space-y-6 md:space-y-8">
      {/* Título */}
      <header className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground capitalize sm:text-base">{monthName}</p>
      </header>

      {/* Barra de filtros bajo el título (ancho completo) */}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <FilterBar
          label="Filtros del resumen"
          description="Elige si ver todos los datos (global), solo los tuyos (personal) o de un grupo. Opcionalmente filtra por una cuenta."
          className="min-w-0 flex-1"
        >
          <FilterField label="Ver datos de">
            <DashboardContextSelector sharedAccounts={sharedAccounts} />
          </FilterField>
          <FilterField label="Cuenta">
            <WalletFilter wallets={wallets} />
          </FilterField>
        </FilterBar>
        <div className="shrink-0">
          <ExportReportDialog context={context} wallet={selectedWalletId} />
        </div>
      </div>

      <DashboardSummaryBanner
        balance={balance}
        savingsRate={savingsRate}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
      />

      {sectionsOrder.map((sectionId) => (
        <div key={sectionId} className="min-w-0">{renderSection(sectionId)}</div>
      ))}
    </div>
  );
}
