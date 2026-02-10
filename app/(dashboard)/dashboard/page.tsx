import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  INCOME_TYPE_LABELS,
  EXPENSE_PRIORITY_LABELS,
  type IncomeType,
  type ExpensePriority,
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

function getMonthBounds(monthOffset: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthOffset);
  const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end, label: d.toLocaleString("es", { month: "short", year: "2-digit" }) };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { wallet?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Process any pending recurring savings fallback
  const { processRecurringSavings } = await import("@/app/actions/savings");
  await processRecurringSavings();

  const selectedWalletId = searchParams.wallet;
  const { start, end } = getMonthBounds(0);
  const monthName = new Date().toLocaleString("es", { month: "long", year: "numeric" });

  // Base queries
  let incomeQuery = supabase.from("incomes").select("amount, income_type").gte("date", start).lte("date", end);
  let expenseQuery = supabase.from("expenses").select("amount, expense_priority").gte("date", start).lte("date", end);

  if (selectedWalletId) {
    incomeQuery = incomeQuery.eq("wallet_id", selectedWalletId);
    expenseQuery = expenseQuery.eq("wallet_id", selectedWalletId);
  }

  const [
    incomesRes,
    expensesRes,
    subscriptionsRes,
    taxRes,
    walletsRes,
    savingsRes,
    trendIncomes,
    trendExpenses,
  ] = await Promise.all([
    incomeQuery,
    expenseQuery,
    supabase.from("subscriptions").select("amount, frequency"),
    supabase.from("tax_obligations").select("amount, paid_at"),
    supabase.from("wallets").select("*").order("balance", { ascending: false }),
    supabase.from("savings_goals").select("*").order("target_date", { ascending: true }),
    Promise.all(
      [0, -1, -2, -3, -4, -5].map(async (offset) => {
        const { start: s, end: e, label } = getMonthBounds(offset);
        let q = supabase.from("incomes").select("amount").gte("date", s).lte("date", e);
        if (selectedWalletId) q = q.eq("wallet_id", selectedWalletId);
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
        const { data } = await q;
        const total = (data ?? []).reduce((sum, i) => sum + Number(i.amount), 0);
        return total;
      })
    ),
  ]);

  const incomes = incomesRes.data ?? [];
  const expenses = expensesRes.data ?? [];
  const subscriptions = subscriptionsRes.data ?? [];
  const taxObligations = taxRes.data ?? [];
  const wallets = walletsRes.data ?? [];
  const savingsGoals = savingsRes.data ?? [];

  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

  const subscriptionsMonthly = subscriptions.reduce((s, sub) => {
    const amt = Number(sub.amount);
    return s + (sub.frequency === "yearly" ? amt / 12 : amt);
  }, 0);
  const taxPending = taxObligations.filter((t) => !t.paid_at).reduce((s, t) => s + Number(t.amount), 0);

  const byIncomeType = incomes.reduce<Record<IncomeType, number>>(
    (acc, i) => {
      const t = i.income_type as IncomeType;
      acc[t] = (acc[t] ?? 0) + Number(i.amount);
      return acc;
    },
    { monthly: 0, irregular: 0, occasional: 0 }
  );
  const byExpensePriority = expenses.reduce<Record<ExpensePriority, number>>(
    (acc, e) => {
      const p = e.expense_priority as ExpensePriority;
      acc[p] = (acc[p] ?? 0) + Number(e.amount);
      return acc;
    },
    { obligatory: 0, necessary: 0, optional: 0 }
  );

  const trendData = trendIncomes.map((m, i) => ({
    month: m.label,
    ingresos: m.total,
    gastos: trendExpenses[i] ?? 0,
    balance: m.total - (trendExpenses[i] ?? 0),
  })).reverse();

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Encabezado */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground capitalize sm:text-base">{monthName}</p>
        </div>
        <WalletFilter wallets={wallets} />
      </header>

      <DashboardSummaryBanner
        balance={balance}
        savingsRate={savingsRate}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
      />

      {/* KPIs: 2 cols móvil, 4 cols desktop, altura uniforme */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="card-hover flex min-h-[100px] flex-col justify-between overflow-hidden border-green-500/20 bg-green-500/5 shadow-sm sm:min-h-[110px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 sm:pb-2 sm:pt-6">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 shrink-0 text-green-600" />
          </CardHeader>
          <CardContent className="pb-4 pt-0 sm:pb-6 sm:pt-0">
            <p className="truncate text-lg font-bold text-green-600 dark:text-green-400 sm:text-2xl">
              ${totalIncome.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover flex min-h-[100px] flex-col justify-between overflow-hidden border-red-500/20 bg-red-500/5 shadow-sm sm:min-h-[110px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 sm:pb-2 sm:pt-6">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Gastos</CardTitle>
            <TrendingDown className="h-4 w-4 shrink-0 text-red-600" />
          </CardHeader>
          <CardContent className="pb-4 pt-0 sm:pb-6 sm:pt-0">
            <p className="truncate text-lg font-bold text-red-600 dark:text-red-400 sm:text-2xl">
              ${totalExpense.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover flex min-h-[100px] flex-col justify-between overflow-hidden border-primary/20 bg-primary/5 shadow-sm sm:min-h-[110px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 sm:pb-2 sm:pt-6">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Balance</CardTitle>
            <Wallet className="h-4 w-4 shrink-0 text-primary" />
          </CardHeader>
          <CardContent className="pb-4 pt-0 sm:pb-6 sm:pt-0">
            <p className={`truncate text-lg font-bold sm:text-2xl ${balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              ${balance.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover flex min-h-[100px] flex-col justify-between overflow-hidden border-amber-500/20 bg-amber-500/5 shadow-sm sm:min-h-[110px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 sm:pb-2 sm:pt-6">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">Tasa ahorro</CardTitle>
            <PiggyBank className="h-4 w-4 shrink-0 text-amber-600" />
          </CardHeader>
          <CardContent className="pb-4 pt-0 sm:pb-6 sm:pt-0">
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 sm:text-2xl">{savingsRate}%</p>
          </CardContent>
        </Card>
      </section>

      {/* Cuentas y Ahorros */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Mis Cuentas */}
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
              {wallets.slice(0, 3).map((wallet) => (
                <div key={wallet.id} className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm truncate">{wallet.name}</span>
                    <span className="text-xs text-muted-foreground uppercase">{wallet.currency}</span>
                  </div>
                  <div className="text-xl font-bold">
                    ${Number(wallet.balance).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 capitalize">
                    {wallet.type === 'debit' ? 'Débito' : wallet.type === 'credit' ? 'Crédito' : wallet.type === 'cash' ? 'Efectivo' : wallet.type}
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

        {/* Metas de Ahorro */}
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
              {savingsGoals.slice(0, 3).map((goal) => {
                const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                return (
                  <div key={goal.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium truncate">{goal.name}</span>
                      <span className="text-muted-foreground">
                        ${Number(goal.current_amount).toLocaleString("es-CO")} / ${Number(goal.target_amount).toLocaleString("es-CO")}
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
      </section>

      {/* Balance ring + tendencia: columna en móvil, 1/3 + 2/3 en desktop */}
      <section className="grid gap-4 md:gap-6 lg:grid-cols-3">
        <Card className="card-hover flex flex-col items-center justify-center shadow-sm p-4 sm:p-6">
          <CardHeader className="w-full p-0 pb-2">
            <CardTitle className="text-center text-sm font-medium">Ingresos vs gastos</CardTitle>
          </CardHeader>
          <BalanceRing balance={balance} totalIncome={totalIncome} totalExpense={totalExpense} />
        </Card>
        <Card className="card-hover shadow-sm lg:col-span-2">
          <CardHeader className="p-4 pb-0 sm:p-6 sm:pb-0">
            <CardTitle className="text-base sm:text-lg">Tendencia (6 meses)</CardTitle>
            <p className="text-xs text-muted-foreground sm:text-sm">Ingresos y gastos por mes</p>
          </CardHeader>
          <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">
            <TrendChart data={trendData} />
          </CardContent>
        </Card>
      </section>

      {/* Gráficas donut: una columna móvil, dos desktop */}
      <section className="grid gap-4 md:grid-cols-2 md:gap-6">
        <Card className="card-hover shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Ingresos por tipo</CardTitle>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link href="/incomes" className="gap-1">
                Ver todo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <IncomePieChart data={byIncomeType} />
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground sm:text-sm">
              {(Object.entries(byIncomeType) as [IncomeType, number][]).map(([type, amount]) => (
                <li key={type} className="flex justify-between gap-2">
                  <span className="truncate">{INCOME_TYPE_LABELS[type]}</span>
                  <span className="shrink-0 tabular-nums">${amount.toLocaleString("es-CO", { minimumFractionDigits: 0 })}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="card-hover shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Gastos por prioridad</CardTitle>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link href="/expenses" className="gap-1">
                Ver todo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <ExpensePieChart data={byExpensePriority} />
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground sm:text-sm">
              {(Object.entries(byExpensePriority) as [ExpensePriority, number][]).map(([priority, amount]) => (
                <li key={priority} className="flex justify-between gap-2">
                  <span className="truncate">{EXPENSE_PRIORITY_LABELS[priority]}</span>
                  <span className="shrink-0 tabular-nums">${amount.toLocaleString("es-CO", { minimumFractionDigits: 0 })}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Accesos rápidos: 2x2 móvil, 4 cols desktop, botones táctiles */}
      <section>
        <h2 className="mb-3 text-base font-semibold sm:text-lg">Accesos rápidos</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Button asChild variant="outline" className="h-auto min-h-[72px] w-full flex-col gap-1 py-3 sm:min-h-0 sm:py-4">
            <Link href="/incomes" className="flex flex-col items-center gap-1">
              <TrendingUp className="h-5 w-5 shrink-0" />
              <span className="text-center text-sm font-medium sm:text-base">Agregar ingreso</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto min-h-[72px] w-full flex-col gap-1 py-3 sm:min-h-0 sm:py-4">
            <Link href="/expenses" className="flex flex-col items-center gap-1">
              <TrendingDown className="h-5 w-5 shrink-0" />
              <span className="text-center text-sm font-medium sm:text-base">Agregar gasto</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto min-h-[72px] w-full flex-col gap-1 py-3 sm:min-h-0 sm:py-4">
            <Link href="/subscriptions" className="flex flex-col items-center gap-1">
              <span className="text-base font-semibold tabular-nums sm:text-lg">${subscriptionsMonthly.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</span>
              <span className="text-center text-xs text-muted-foreground">Suscripciones / mes</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto min-h-[72px] w-full flex-col gap-1 py-3 sm:min-h-0 sm:py-4">
            <Link href="/taxes" className="flex flex-col items-center gap-1">
              <span className="text-base font-semibold tabular-nums text-amber-600 sm:text-lg">${taxPending.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</span>
              <span className="text-center text-xs text-muted-foreground">Impuestos pendientes</span>
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
