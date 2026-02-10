"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createLoan, updateLoan } from "@/app/actions/loans";
import type { Loan } from "@/lib/database.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editLoan?: Loan | null;
};

export function LoanForm({ open, onOpenChange, editLoan }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [principal, setPrincipal] = useState("");
  const [annualRate, setAnnualRate] = useState("");
  const [termMonths, setTermMonths] = useState("");
  const [startDate, setStartDate] = useState("");
  const [description, setDescription] = useState("");

  const isEdit = Boolean(editLoan?.id);

  useEffect(() => {
    if (open) {
      setName(editLoan?.name ?? "");
      setPrincipal(editLoan ? String(editLoan.principal) : "");
      setAnnualRate(editLoan ? String(editLoan.annual_interest_rate) : "");
      setTermMonths(editLoan ? String(editLoan.term_months) : "");
      setStartDate(editLoan?.start_date ?? new Date().toISOString().slice(0, 10));
      setDescription(editLoan?.description ?? "");
      setError(null);
    }
  }, [open, editLoan]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = {
      name,
      principal: Number(principal),
      annual_interest_rate: Number(annualRate),
      term_months: Number(termMonths),
      start_date: startDate,
      currency: "COP",
      description: description || undefined,
    };
    const result = isEdit
      ? await updateLoan(editLoan!.id, formData)
      : await createLoan(formData);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar préstamo" : "Nuevo préstamo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Auto, hipoteca..." required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="principal">Capital</Label>
              <Input id="principal" type="number" step="0.01" min="0.01" value={principal} onChange={(e) => setPrincipal(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Tasa anual (%)</Label>
              <Input id="rate" type="number" step="0.01" min="0" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="term">Plazo (meses)</Label>
              <Input id="term" type="number" min="1" value={termMonths} onChange={(e) => setTermMonths(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha de inicio</Label>
              <Input id="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Notas (opcional)</Label>
            <Textarea id="description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
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
