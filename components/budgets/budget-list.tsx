"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import type { Budget, Category } from "@/lib/database.types";
import { BudgetForm } from "./budget-form";
import { deleteBudget } from "@/app/actions/budgets";
import { useRouter } from "next/navigation";
import { formatNumber } from "@/lib/utils";

interface BudgetListProps {
    budgets: (Budget & { category: Category })[];
    categories: Category[];
}

export function BudgetList({ budgets, categories }: BudgetListProps) {
    const router = useRouter();
    const [editing, setEditing] = useState<Budget | null>(null);
    const [formOpen, setFormOpen] = useState(false);

    async function onDelete(id: string) {
        if (confirm("¿Seguro que quieres eliminar este presupuesto?")) {
            await deleteBudget(id);
            router.refresh();
        }
    }

    return (
        <div className="space-y-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Periodo</TableHead>
                        <TableHead className="text-right">Monto Límite</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {budgets.map((b) => (
                        <TableRow key={b.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: b.category.color }}
                                    />
                                    {b.category.name}
                                </div>
                            </TableCell>
                            <TableCell className="capitalize">{b.period}</TableCell>
                            <TableCell className="text-right font-medium">
                                ${formatNumber(Number(b.amount))}
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setEditing(b);
                                            setFormOpen(true);
                                        }}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(b.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {budgets.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                No hay presupuestos definidos.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <BudgetForm
                open={formOpen}
                onOpenChange={(o) => {
                    setFormOpen(o);
                    if (!o) setEditing(null);
                }}
                categories={categories}
                editBudget={editing}
            />
        </div>
    );
}
