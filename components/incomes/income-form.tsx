"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import { INCOME_TYPE_LABELS, type IncomeType, type Tag } from "@/lib/database.types";
import { createIncome, updateIncome } from "@/app/actions/incomes";
import { getTags, setTransactionTags } from "@/app/actions/tags";
import type { Income, SharedAccount, Wallet, Category } from "@/lib/database.types";
import { TagSelector } from "@/components/tags/tag-selector";

type IncomeFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editIncome?: Income | null;
  sharedAccounts?: SharedAccount[];
  wallets: Wallet[];
  categories: Category[];
};

export function IncomeForm({ open, onOpenChange, editIncome, sharedAccounts = [], wallets = [], categories = [] }: IncomeFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [incomeType, setIncomeType] = useState<IncomeType>("monthly");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [sharedAccountId, setSharedAccountId] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const isEdit = Boolean(editIncome?.id);

  useEffect(() => {
    if (open) {
      setAmount(editIncome ? String(editIncome.amount) : "");
      setIncomeType(editIncome?.income_type ?? "monthly");
      setDate(editIncome?.date ?? new Date().toISOString().slice(0, 10));
      setDescription(editIncome?.description ?? "");
      setSharedAccountId(editIncome?.shared_account_id ?? null);
      setWalletId(editIncome?.wallet_id ?? "");
      setCategoryId(editIncome?.category_id ?? null);
      setSelectedTagIds(editIncome?.tags?.map(t => t.id) ?? []);
      setError(null);

      // Fetch tags
      getTags().then(res => {
        if (res.data) setAvailableTags(res.data);
      });
    }
  }, [open, editIncome]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = {
      amount: Number(amount),
      currency: "COP",
      income_type: incomeType,
      description: description || undefined,
      date,
      wallet_id: walletId || undefined,
      category_id: categoryId || undefined,
      ...(isEdit ? {} : { shared_account_id: sharedAccountId || null }),
    };

    const result = isEdit
      ? await updateIncome(editIncome!.id, formData)
      : await createIncome(formData);

    if (result.error) {
      setLoading(false);
      setError(result.error);
      return;
    }

    // Save tags
    const transactionId = isEdit ? editIncome!.id : result.data?.id;
    if (transactionId) {
      await setTransactionTags(transactionId, selectedTagIds, "income");
    }

    setLoading(false);
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
            <Label htmlFor="wallet">Cuenta de destino</Label>
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
              <Label>Añadir a grupo compartido</Label>
              <Select
                value={sharedAccountId ?? "personal"}
                onValueChange={(v) => setSharedAccountId(v === "personal" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mi cuenta personal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Mi cuenta personal</SelectItem>
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
            <Label htmlFor="category">Categoría (opcional)</Label>
            <Select value={categoryId ?? "none"} onValueChange={(v) => setCategoryId(v === "none" ? null : v)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin categoría</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: c.color }}>{c.icon}</span>
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <CurrencyInput
              id="amount"
              required
              value={amount}
              onChange={(v) => setAmount(String(v))}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="income_type">Tipo de ingreso</Label>
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
          <div className="space-y-2">
            <Label>Etiquetas</Label>
            <TagSelector
              allTags={availableTags}
              selectedTagIds={selectedTagIds}
              onToggleTag={(id) => {
                setSelectedTagIds(prev =>
                  prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
                );
              }}
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
