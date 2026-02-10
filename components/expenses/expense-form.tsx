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
import { EXPENSE_PRIORITY_LABELS, type ExpensePriority } from "@/lib/database.types";
import { createExpense, updateExpense } from "@/app/actions/expenses";
import type { Expense, SharedAccount, Wallet } from "@/lib/database.types";

type ExpenseFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editExpense?: Expense | null;
  sharedAccounts?: SharedAccount[];
  wallets: Wallet[];
};

export function ExpenseForm({ open, onOpenChange, editExpense, sharedAccounts = [], wallets = [] }: ExpenseFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [priority, setPriority] = useState<ExpensePriority>("necessary");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [sharedAccountId, setSharedAccountId] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string>("");

  const isEdit = Boolean(editExpense?.id);

  useEffect(() => {
    if (open) {
      setAmount(editExpense ? String(editExpense.amount) : "");
      setPriority(editExpense?.expense_priority ?? "necessary");
      setDate(editExpense?.date ?? new Date().toISOString().slice(0, 10));
      setDescription(editExpense?.description ?? "");
      setSharedAccountId(editExpense?.shared_account_id ?? null);
      setWalletId(editExpense?.wallet_id ?? "");
      setError(null);
    }
  }, [open, editExpense]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = {
      amount: Number(amount),
      currency: "COP",
      expense_priority: priority,
      description: description || undefined,
      date,
      wallet_id: walletId || undefined,
      ...(isEdit ? {} : { shared_account_id: sharedAccountId || null }),
    };

    const result = isEdit
      ? await updateExpense(editExpense!.id, formData)
      : await createExpense(formData);

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
          <DialogTitle>{isEdit ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="wallet">Cuenta de origen (pago)</Label>
            <Select value={walletId} onValueChange={setWalletId}>
              <SelectTrigger id="wallet">
                <SelectValue placeholder="Selecciona una cuenta" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} ({w.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Si no seleccionas cuenta, se considerará efectivo sin cuenta específica (o cuenta por defecto).
            </p>
          </div>

          {!isEdit && sharedAccounts.length > 0 && (
            <div className="space-y-2">
              <Label>Añadir a</Label>
              <Select
                value={sharedAccountId ?? "personal"}
                onValueChange={(v) => setSharedAccountId(v === "personal" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mi cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Mi cuenta</SelectItem>
                  {sharedAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <Label htmlFor="expense_priority">Prioridad</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as ExpensePriority)}>
              <SelectTrigger id="expense_priority">
                <SelectValue placeholder="Selecciona prioridad" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(EXPENSE_PRIORITY_LABELS) as [ExpensePriority, string][]).map(
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
              placeholder="Ej. Supermercado, renta..."
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
