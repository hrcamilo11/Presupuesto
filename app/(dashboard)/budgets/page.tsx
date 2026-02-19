import { getBudgets } from "@/app/actions/budgets";
import { getCategories } from "@/app/actions/categories";
import { getMySharedAccounts } from "@/app/actions/shared-accounts";
import { BudgetList } from "@/components/budgets/budget-list";
import { BudgetFormWrapper } from "@/components/budgets/budget-form-wrapper";
import { BudgetContextSelector } from "@/components/budgets/budget-context-selector";
import { FilterBar, FilterField } from "@/components/ui/filter-bar";
import { MonthPicker } from "@/components/month-picker";
import { createClient } from "@/lib/supabase/server";

type SearchParams = { context?: string; year?: string; month?: string };

export default async function BudgetsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const context = params.context;
    const sharedAccountId =
        context && context !== "personal" ? context : undefined;

    const now = new Date();
    const year = params.year ? parseInt(params.year) : now.getFullYear();
    const month = params.month ? parseInt(params.month) : now.getMonth() + 1;

    const start = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const end = new Date(year, month, 0).toISOString().slice(0, 10);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [{ data: budgets }, { data: categories }, { data: sharedAccounts }] = await Promise.all([
        getBudgets(sharedAccountId),
        getCategories("expense"),
        getMySharedAccounts(),
    ]);

    // Fetch expenses for the selected month to show performance
    let expenseQuery = supabase
        .from("expenses")
        .select("amount, category_id, date")
        .gte("date", start)
        .lte("date", end);

    if (sharedAccountId) {
        expenseQuery = expenseQuery.eq("shared_account_id", sharedAccountId);
    } else {
        expenseQuery = expenseQuery.is("shared_account_id", null).eq("user_id", user?.id);
    }

    const { data: expenses } = await expenseQuery;

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
                        <p className="text-muted-foreground">
                            Gestiona tus límites de gastos por categoría.
                        </p>
                    </div>
                    <BudgetFormWrapper
                        categories={categories || []}
                        sharedAccountId={sharedAccountId ?? null}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <FilterBar
                        label="Contexto"
                        description="Cambia entre tus presupuestos personales o de un grupo."
                    >
                        <FilterField label="Ver presupuestos de">
                            <BudgetContextSelector sharedAccounts={sharedAccounts || []} />
                        </FilterField>
                    </FilterBar>

                    <FilterBar
                        label="Periodo"
                        description="Navega entre meses para ver tu desempeño histórico."
                    >
                        <FilterField label="Seleccionar mes">
                            <MonthPicker month={month} year={year} />
                        </FilterField>
                    </FilterBar>
                </div>
            </div>

            <BudgetList
                budgets={(budgets || []) as any}
                categories={categories || []}
                sharedAccountId={sharedAccountId ?? null}
                expenses={(expenses || []) as any}
            />
        </div>
    );
}
