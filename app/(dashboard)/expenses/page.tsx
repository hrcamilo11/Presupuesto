import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ExpenseList } from "@/components/expenses/expense-list";
import { MonthPicker } from "@/components/month-picker";

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

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false });

  return (
    <div className="space-y-6">
      <MonthPicker year={year} month={month} />
      <ExpenseList expenses={expenses ?? []} year={year} month={month} />
    </div>
  );
}
