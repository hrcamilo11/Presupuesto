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

interface BudgetListProps {
    budgets: (Budget & { category: Category })[];
    categories: Category[];
    sharedAccountId?: string | null;
}

export function BudgetList({ budgets, categories, sharedAccountId }: BudgetListProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [editing, setEditing] = useState<Budget | null>(null);
    const [formOpen, setFormOpen] = useState(false);

    async function onDelete(id: string) {
        // if (confirm("¿Seguro que quieres eliminar este presupuesto?")) {
        await deleteBudget(id);
        toast({
            title: "Presupuesto eliminado",
            description: "El presupuesto se ha eliminado correctamente.",
        });
        router.refresh();
        // }
    }

    const categoryFor = (b: Budget & { category?: Category; categories?: Category }) => {
        const cat = b.category ?? (b as { categories?: Category }).categories;
        return cat ?? categories.find((c) => c.id === b.category_id);
    };

    return (
        <div className="space-y-4">
            {/* Vista en pantallas pequeñas: tarjetas */}
            <div className="space-y-3 lg:hidden">
                {budgets.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                        No hay presupuestos definidos.
                    </p>
                ) : (
                    budgets.map((b) => {
                        const cat = categoryFor(b);
                        return (
                            <div
                                key={b.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    {cat && (
                                        <div
                                            className="h-3 w-3 shrink-0 rounded-full"
                                            style={{ backgroundColor: cat.color }}
                                        />
                                    )}
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">{cat?.name ?? "—"}</p>
                                        <p className="text-sm text-muted-foreground capitalize">
                                            {b.period} · ${formatNumber(Number(b.amount))}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setEditing(b);
                                            setFormOpen(true);
                                        }}
                                        aria-label="Editar"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(b.id)}
                                        aria-label="Eliminar"
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Vista escritorio: tabla */}
            <div className="hidden lg:block overflow-x-auto">
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
                        {budgets.map((b) => {
                            const cat = categoryFor(b);
                            return (
                                <TableRow key={b.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {cat && (
                                                <div
                                                    className="h-3 w-3 rounded-full"
                                                    style={{ backgroundColor: cat.color }}
                                                />
                                            )}
                                            {cat?.name ?? "—"}
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
                            );
                        })}
                        {budgets.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
