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
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

interface BudgetListProps {
    budgets: (Budget & { category: Category })[];
    categories: Category[];
    sharedAccountId?: string | null;
    expenses?: { amount: number; category_id: string }[];
}

export function BudgetList({ budgets, categories, sharedAccountId, expenses = [] }: BudgetListProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [editing, setEditing] = useState<Budget | null>(null);
    const [formOpen, setFormOpen] = useState(false);

    async function onDelete(id: string) {
        await deleteBudget(id);
        toast({
            title: "Presupuesto eliminado",
            description: "El presupuesto se ha eliminado correctamente.",
        });
        router.refresh();
    }

    const categoryFor = (b: Budget & { category?: Category; categories?: Category }) => {
        const cat = b.category ?? (b as { categories?: Category }).categories;
        return cat ?? categories.find((c) => c.id === b.category_id);
    };

    const getSpentFor = (categoryId: string) => {
        return expenses
            .filter((e) => e.category_id === categoryId)
            .reduce((acc, e) => acc + Number(e.amount), 0);
    };

    return (
        <div className="space-y-4">
            {/* Vista en pantallas pequeñas: tarjetas */}
            <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
                {budgets.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground col-span-full">
                        No hay presupuestos definidos.
                    </p>
                ) : (
                    budgets.map((b) => {
                        const cat = categoryFor(b);
                        const spent = cat ? getSpentFor(cat.id) : 0;
                        const limit = Number(b.amount);
                        const percent = Math.min((spent / limit) * 100, 100);
                        const isExceeded = spent > limit;

                        return (
                            <div
                                key={b.id}
                                className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm"
                            >
                                <div className="flex items-center justify-between gap-2 min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {cat && (
                                            <div
                                                className="h-3 w-3 shrink-0 rounded-full"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{cat?.name ?? "—"}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
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
                                            className="h-8 w-8"
                                            onClick={() => onDelete(b.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                                            Progreso del gasto
                                        </span>
                                        <span className={`font-semibold ${isExceeded ? "text-destructive" : "text-foreground"}`}>
                                            ${formatNumber(spent)} / ${formatNumber(limit)}
                                        </span>
                                    </div>
                                    <Progress
                                        value={percent}
                                        className={`h-2 ${isExceeded ? "bg-destructive/20" : ""}`}
                                    />
                                    {isExceeded && (
                                        <p className="text-[10px] text-destructive font-bold text-right">
                                            EXCEDIDO POR ${formatNumber(spent - limit)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Vista escritorio: tabla */}
            <div className="hidden lg:block overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[200px]">Categoría</TableHead>
                            <TableHead>Estado del Presupuesto</TableHead>
                            <TableHead className="text-right w-[200px]">Gasto / Límite</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {budgets.map((b) => {
                            const cat = categoryFor(b);
                            const spent = cat ? getSpentFor(cat.id) : 0;
                            const limit = Number(b.amount);
                            const percent = Math.min((spent / limit) * 100, 100);
                            const isExceeded = spent > limit;

                            return (
                                <TableRow key={b.id} className="group">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            {cat && (
                                                <div
                                                    className="h-3 w-3 rounded-full shadow-sm"
                                                    style={{ backgroundColor: cat.color }}
                                                />
                                            )}
                                            {cat?.name ?? "—"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5 max-w-[400px]">
                                            <Progress
                                                value={percent}
                                                className={`h-2 ${isExceeded ? "bg-destructive/20" : ""}`}
                                            />
                                            {isExceeded && (
                                                <span className="text-[10px] text-destructive font-bold uppercase tracking-tight">
                                                    Excedido por ${formatNumber(spent - limit)}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right whitespace-nowrap">
                                        <span className={`font-semibold ${isExceeded ? "text-destructive" : ""}`}>
                                            ${formatNumber(spent)}
                                        </span>
                                        <span className="text-muted-foreground text-xs mx-1">/</span>
                                        <span className="text-muted-foreground font-medium">
                                            ${formatNumber(limit)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
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
                                                className="h-8 w-8"
                                                onClick={() => onDelete(b.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {budgets.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                                    No hay presupuestos definidos.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <BudgetForm
                open={formOpen}
                onOpenChange={(o) => {
                    setFormOpen(o);
                    if (!o) setEditing(null);
                }}
                categories={categories}
                editBudget={editing}
                sharedAccountId={sharedAccountId}
            />
        </div>
    );
}
