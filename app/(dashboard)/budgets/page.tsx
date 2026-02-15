/* eslint-disable @typescript-eslint/no-explicit-any */
import { getBudgets } from "@/app/actions/budgets";
import { getCategories } from "@/app/actions/categories";
import { getMySharedAccounts } from "@/app/actions/shared-accounts";
import { BudgetList } from "@/components/budgets/budget-list";
import { BudgetFormWrapper } from "@/components/budgets/budget-form-wrapper";
import { BudgetContextSelector } from "@/components/budgets/budget-context-selector";
import { FilterBar, FilterField } from "@/components/ui/filter-bar";

type SearchParams = { context?: string };

export default async function BudgetsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const context = params.context;
    const sharedAccountId =
        context && context !== "personal" ? context : undefined;

    const [{ data: budgets }, { data: categories }, { data: sharedAccounts }] = await Promise.all([
        getBudgets(sharedAccountId),
        getCategories("expense"),
        getMySharedAccounts(),
    ]);

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col gap-4">
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
                <FilterBar
                    label="Presupuestos a mostrar"
                    description="Personales = solo los tuyos. Si eliges un grupo, verás y podrás crear presupuestos de ese grupo."
                >
                    <FilterField label="Ver presupuestos de">
                        <BudgetContextSelector sharedAccounts={sharedAccounts || []} />
                    </FilterField>
                </FilterBar>
            </div>

            <BudgetList
                budgets={budgets as any}
                categories={categories || []}
                sharedAccountId={sharedAccountId ?? null}
            />
        </div>
    );
}
