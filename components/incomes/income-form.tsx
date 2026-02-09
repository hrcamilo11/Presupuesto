"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { INCOME_TYPE_LABELS, type IncomeType } from "@/lib/database.types";
import { createIncome, updateIncome } from "@/app/actions/incomes";
import type { Income } from "@/lib/database.types";

type IncomeFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editIncome?: Income | null;
};

export function IncomeForm({ open, onOpenChange, editIncome }: IncomeFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [incomeType, setIncomeType] = useState<IncomeType>("monthly");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  const isEdit = Boolean(editIncome?.id);

  useEffect(() => {
    if (open) {
      setAmount(editIncome ? String(editIncome.amount) : "");
      setIncomeType(editIncome?.income_type ?? "monthly");
      setDate(editIncome?.date ?? new Date().toISOString().slice(0, 10));
      setDescription(editIncome?.description ?? "");
      setError(null);
    }
  }, [open, editIncome]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = {
      amount: Number(amount),
      currency: "MXN",
      income_type: incomeType,
      description: description || undefined,
      date,
    };

    const result = isEdit
      ? await updateIncome(editIncome!.id, formData)
      : await createIncome(formData);

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar ingreso" : "Nuevo ingreso"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="income_type">Tipo</Label>
            <Select value={incomeType} onValueChange={(v) => setIncomeType(v as IncomeType)}>
              <SelectTrigger id="income_type">
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(INCOME_TYPE_LABELS) as [IncomeType, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Sueldo, freelance..."
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando…" : isEdit ? "Guardar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
