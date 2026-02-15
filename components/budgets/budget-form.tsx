"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { upsertBudget } from "@/app/actions/budgets";
import type { Category, Budget } from "@/lib/database.types";

interface BudgetFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
    editBudget?: Budget | null;
    sharedAccountId?: string | null;
}

export function BudgetForm({ open, onOpenChange, categories, editBudget, sharedAccountId }: BudgetFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categoryId, setCategoryId] = useState(editBudget?.category_id || "");
    const [amount, setAmount] = useState(editBudget ? String(editBudget.amount) : "");
    const [period, setPeriod] = useState(editBudget?.period || "monthly");

    useState(() => {
        if (editBudget) {
            setCategoryId(editBudget.category_id);
            setAmount(String(editBudget.amount));
            setPeriod(editBudget.period);
        }
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const result = await upsertBudget({
            id: editBudget?.id,
            category_id: categoryId,
            amount: Number(amount),
            period,
            shared_account_id: editBudget?.shared_account_id ?? sharedAccountId ?? null,
        });

        setLoading(false);
        if (result.error) {
            alert(result.error);
            return;
        }

        onOpenChange(false);
        router.refresh();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editBudget ? "Editar Presupuesto" : "Nuevo Presupuesto"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Categoría</Label>
                        <Select value={categoryId} onValueChange={setCategoryId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto Límite</Label>
                        <CurrencyInput
                            id="amount"
                            value={amount}
                            onChange={(v) => setAmount(String(v))}
                            placeholder="0"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Periodo</Label>
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="monthly">Mensual</SelectItem>
                                <SelectItem value="weekly">Semanal</SelectItem>
                                <SelectItem value="yearly">Anual</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editBudget ? "Guardar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
