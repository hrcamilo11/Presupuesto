"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Budget, Category, Expense } from "@/lib/database.types";

interface BudgetSummaryProps {
    budgets: (Budget & { category?: Category; categories?: Category })[];
    expenses: Expense[];
}

export function BudgetSummary({ budgets, expenses }: BudgetSummaryProps) {
    if (budgets.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Presupuestos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {budgets.map((budget) => {
                    const cat = budget.category ?? budget.categories;
                    if (!cat) return null;

                    const spent = expenses
                        .filter((e) => e.category_id === budget.category_id)
                        .reduce((acc, e) => acc + Number(e.amount), 0);

                    const percent = Math.min((spent / budget.amount) * 100, 100);
                    const isExceeded = spent > budget.amount;

                    return (
                        <div key={budget.id} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 font-medium">
                                    <div
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: cat.color }}
                                    />
                                    {cat.name}
                                </div>
                                <div className="text-muted-foreground">
                                    ${spent.toLocaleString()} / ${Number(budget.amount).toLocaleString()}
                                </div>
                            </div>
                            <Progress
                                value={percent}
                                className={`h-2 ${isExceeded ? "bg-destructive/20" : ""}`}
                            />
                            {isExceeded && (
                                <p className="text-[10px] text-destructive font-medium">
                                    Límite excedido por ${(spent - budget.amount).toLocaleString()}
                                </p>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

