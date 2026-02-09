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

function getMonthBounds(monthOffset: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthOffset);
  const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end, label: d.toLocaleString("es", { month: "short", year: "2-digit" }) };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { start, end } = getMonthBounds(0);
  const monthName = new Date().toLocaleString("es", { month: "long", year: "numeric" });

  const [
    incomesRes,
    expensesRes,
    subscriptionsRes,
    taxRes,
    trendIncomes,
    trendExpenses,
  ] = await Promise.all([
    supabase.from("incomes").select("amount, income_type").eq("user_id", user.id).gte("date", start).lte("date", end),
    supabase.from("expenses").select("amount, expense_priority").eq("user_id", user.id).gte("date", start).lte("date", end),
    supabase.from("subscriptions").select("amount, frequency").eq("user_id", user.id),
    supabase.from("tax_obligations").select("amount, paid_at").eq("user_id", user.id),
    Promise.all(
      [0, -1, -2, -3, -4, -5].map(async (offset) => {
        const { start: s, end: e, label } = getMonthBounds(offset);
        const { data } = await supabase.from("incomes").select("amount").eq("user_id", user.id).gte("date", s).lte("date", e);
        const total = (data ?? []).reduce((sum, i) => sum + Number(i.amount), 0);
        return { label, total };
      })
    ),
    Promise.all(
      [0, -1, -2, -3, -4, -5].map(async (offset) => {
        const { start: s, end: e } = getMonthBounds(offset);
        const { data } = await supabase.from("expenses").select("amount").eq("user_id", user.id).gte("date", s).lte("date", e);
        const total = (data ?? []).reduce((sum, i) => sum + Number(i.amount), 0);
        return total;
      })
    ),
  ]);

  const incomes = incomesRes.data ?? [];
  const expenses = expensesRes.data ?? [];
  const subscriptions = subscriptionsRes.data ?? [];
  const taxObligations = taxRes.data ?? [];

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
      <header className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground capitalize sm:text-base">{monthName}</p>
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
              ${totalIncome.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
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
              ${totalExpense.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
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
              ${balance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
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
                  <span className="shrink-0 tabular-nums">${amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
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
                  <span className="shrink-0 tabular-nums">${amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
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
              <span className="text-base font-semibold tabular-nums sm:text-lg">${subscriptionsMonthly.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
              <span className="text-center text-xs text-muted-foreground">Suscripciones / mes</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto min-h-[72px] w-full flex-col gap-1 py-3 sm:min-h-0 sm:py-4">
            <Link href="/taxes" className="flex flex-col items-center gap-1">
              <span className="text-base font-semibold tabular-nums text-amber-600 sm:text-lg">${taxPending.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
              <span className="text-center text-xs text-muted-foreground">Impuestos pendientes</span>
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
