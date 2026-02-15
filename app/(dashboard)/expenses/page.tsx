import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExpenseList } from "@/components/expenses/expense-list";
import { MonthPicker } from "@/components/month-picker";
import { DashboardContextSelector } from "@/components/dashboard/dashboard-context-selector";
import { FilterBar, FilterField } from "@/components/ui/filter-bar";
import { getCategories } from "@/app/actions/categories";
import { getMySharedAccounts } from "@/app/actions/shared-accounts";
import { getWallets } from "@/app/actions/wallets";

type SearchParams = { year?: string; month?: string; context?: string };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;

  const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  const context = params.context;

  let expensesQuery = supabase
    .from("expenses")
    .select("*")
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });
  if (context === "personal") {
    expensesQuery = expensesQuery.is("shared_account_id", null);
  } else if (context && context !== "global") {
    expensesQuery = expensesQuery.eq("shared_account_id", context);
  }

  const [{ data: expenses }, { data: sharedAccounts }, { data: wallets }, { data: categories }] =
    await Promise.all([
      expensesQuery,
      getMySharedAccounts(),
      getWallets(),
      getCategories("expense"),
    ]);

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gastos</h1>
          <p className="text-muted-foreground">Gestiona tus salidas de dinero.</p>
        </div>
        <FilterBar
          label="Filtrar listado"
          description="Elige el mes y si ver todos los gastos, solo los tuyos o los de un grupo."
        >
          <MonthPicker year={year} month={month} />
          <FilterField label="Ver datos de">
            <DashboardContextSelector sharedAccounts={sharedAccounts ?? []} />
          </FilterField>
        </FilterBar>
      </div>

      <ExpenseList
        expenses={expenses || []}
        sharedAccounts={sharedAccounts || []}
        wallets={wallets || []}
        categories={categories || []}
        year={year}
        month={month}
      />
    </div>
  );
}
