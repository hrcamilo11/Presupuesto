import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { IncomeList } from "@/components/incomes/income-list";
import { IncomesAddButton } from "@/components/incomes/incomes-add-button";
import { MonthPicker } from "@/components/month-picker";
import { DashboardContextSelector } from "@/components/dashboard/dashboard-context-selector";
import { FilterBar, FilterField } from "@/components/ui/filter-bar";
import { getCategories } from "@/app/actions/categories";
import { getMySharedAccounts } from "@/app/actions/shared-accounts";
import { getWallets } from "@/app/actions/wallets";

type SearchParams = { year?: string; month?: string; context?: string };

export default async function IncomesPage({
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

  let incomesQuery = supabase
    .from("incomes")
    .select("*")
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });
  if (context === "personal") {
    incomesQuery = incomesQuery.is("shared_account_id", null);
  } else if (context && context !== "global") {
    incomesQuery = incomesQuery.eq("shared_account_id", context);
  }

  const [{ data: incomes }, { data: wallets }, { data: sharedAccounts }, { data: categories }] =
    await Promise.all([
      incomesQuery,
      getWallets(),
      getMySharedAccounts(),
      getCategories("income"),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-2xl font-bold">Ingresos</h1>
            <p className="text-muted-foreground">Gestiona tus entradas de dinero.</p>
          </div>
          <IncomesAddButton
            sharedAccounts={sharedAccounts ?? []}
            wallets={wallets ?? []}
            categories={categories ?? []}
          />
        </div>
        <FilterBar
          label="Filtrar listado"
          description="Elige el mes y si ver todos los ingresos, solo los tuyos o los de un grupo."
        >
          <MonthPicker year={year} month={month} />
          <FilterField label="Ver datos de">
            <DashboardContextSelector sharedAccounts={sharedAccounts ?? []} />
          </FilterField>
        </FilterBar>
      </div>
      <IncomeList
        incomes={incomes ?? []}
        sharedAccounts={sharedAccounts ?? []}
        wallets={wallets ?? []}
        categories={categories ?? []}
      />
    </div>
  );
}
