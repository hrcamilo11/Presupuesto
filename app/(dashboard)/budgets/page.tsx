/* eslint-disable @typescript-eslint/no-explicit-any */
import { getBudgets } from "@/app/actions/budgets";
import { getCategories } from "@/app/actions/categories";
import { BudgetList } from "@/components/budgets/budget-list";
import { BudgetFormWrapper } from "@/components/budgets/budget-form-wrapper";

export default async function BudgetsPage() {
    const { data: budgets } = await getBudgets();
    const { data: categories } = await getCategories("expense");

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
                    <p className="text-muted-foreground">
                        Gestiona tus límites de gastos por categoría.
                    </p>
                </div>
                <BudgetFormWrapper categories={categories || []} />
            </div>

            <BudgetList budgets={budgets as any} categories={categories || []} />
        </div>
    );
}
