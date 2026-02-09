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
import { TAX_PERIOD_LABELS, type TaxPeriodType } from "@/lib/database.types";
import { createTaxObligation, updateTaxObligation } from "@/app/actions/tax";
import type { TaxObligation } from "@/lib/database.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTax?: TaxObligation | null;
};

export function TaxForm({ open, onOpenChange, editTax }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [periodType, setPeriodType] = useState<TaxPeriodType>("yearly");
  const [dueDate, setDueDate] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [notes, setNotes] = useState("");

  const isEdit = Boolean(editTax?.id);

  useEffect(() => {
    if (open) {
      setName(editTax?.name ?? "");
      setAmount(editTax ? String(editTax.amount) : "");
      setPeriodType(editTax?.period_type ?? "yearly");
      setDueDate(editTax?.due_date ?? new Date().toISOString().slice(0, 10));
      setPaidAt(editTax?.paid_at ?? "");
      setNotes(editTax?.notes ?? "");
      setError(null);
    }
  }, [open, editTax]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = {
      name,
      amount: Number(amount),
      currency: "MXN",
      period_type: periodType,
      due_date: dueDate,
      paid_at: paidAt || undefined,
      notes: notes || undefined,
    };
    const result = isEdit
      ? await updateTaxObligation(editTax!.id, formData)
      : await createTaxObligation(formData);
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
          <DialogTitle>{isEdit ? "Editar obligación fiscal" : "Nueva obligación fiscal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ISR, IVA, predial..." required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Monto estimado</Label>
            <Input id="amount" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="period_type">Periodo</Label>
            <Select value={periodType} onValueChange={(v) => setPeriodType(v as TaxPeriodType)}>
              <SelectTrigger id="period_type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(TAX_PERIOD_LABELS) as [TaxPeriodType, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="due_date">Fecha de vencimiento</Label>
            <Input id="due_date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paid_at">Fecha de pago (si ya pagaste)</Label>
            <Input id="paid_at" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Guardando…" : isEdit ? "Guardar" : "Agregar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
