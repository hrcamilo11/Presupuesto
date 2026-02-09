import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  INCOME_TYPE_LABELS,
  EXPENSE_PRIORITY_LABELS,
  type IncomeType,
  type ExpensePriority,
} from "@/lib/database.types";

function getMonthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
  return { start, end };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { start, end } = getMonthBounds();

  const [incomesRes, expensesRes] = await Promise.all([
    supabase
      .from("incomes")
      .select("amount, income_type")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end),
    supabase
      .from("expenses")
      .select("amount, expense_priority")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end),
  ]);

  const incomes = incomesRes.data ?? [];
  const expenses = expensesRes.data ?? [];

  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalIncome - totalExpense;

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

  const monthName = new Date().toLocaleString("es", { month: "long", year: "numeric" });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground capitalize">{monthName}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${totalIncome.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${totalExpense.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                balance >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              ${balance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(Object.entries(byIncomeType) as [IncomeType, number][]).map(
                ([type, amount]) => (
                  <li
                    key={type}
                    className="flex justify-between text-sm"
                  >
                    <span>{INCOME_TYPE_LABELS[type]}</span>
                    <span>
                      $
                      {amount.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </li>
                )
              )}
            </ul>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/incomes">Ver ingresos</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gastos por prioridad</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(Object.entries(byExpensePriority) as [ExpensePriority, number][]).map(
                ([priority, amount]) => (
                  <li
                    key={priority}
                    className="flex justify-between text-sm"
                  >
                    <span>{EXPENSE_PRIORITY_LABELS[priority]}</span>
                    <span>
                      $
                      {amount.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </li>
                )
              )}
            </ul>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/expenses">Ver gastos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
