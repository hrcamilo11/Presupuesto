import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExpenseList } from "@/components/expenses/expense-list";
import { getCategories } from "@/app/actions/categories";
import { getMySharedAccounts } from "@/app/actions/shared-accounts";
import { getWallets } from "@/app/actions/wallets";

type SearchParams = { year?: string; month?: string };

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

  const [{ data: expenses }, { data: sharedAccounts }, { data: wallets }, { data: categories }] =
    await Promise.all([
      supabase
        .from("expenses")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false }),
      getMySharedAccounts(),
      getWallets(),
      getCategories("expense"),
    ]);

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gastos</h1>
          <p className="text-muted-foreground">Gestiona tus salidas de dinero.</p>
        </div>
        <div className="flex gap-2">
          {/* No wrapper needed, button is inside list */}
        </div>
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
