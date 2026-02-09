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
import { SUBSCRIPTION_FREQUENCY_LABELS, type SubscriptionFrequency } from "@/lib/database.types";
import { createSubscription, updateSubscription } from "@/app/actions/subscriptions";
import type { Subscription } from "@/lib/database.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editSubscription?: Subscription | null;
};

export function SubscriptionForm({ open, onOpenChange, editSubscription }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<SubscriptionFrequency>("monthly");
  const [nextDueDate, setNextDueDate] = useState("");
  const [description, setDescription] = useState("");

  const isEdit = Boolean(editSubscription?.id);

  useEffect(() => {
    if (open) {
      setName(editSubscription?.name ?? "");
      setAmount(editSubscription ? String(editSubscription.amount) : "");
      setFrequency(editSubscription?.frequency ?? "monthly");
      setNextDueDate(editSubscription?.next_due_date ?? new Date().toISOString().slice(0, 10));
      setDescription(editSubscription?.description ?? "");
      setError(null);
    }
  }, [open, editSubscription]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = {
      name,
      amount: Number(amount),
      currency: "MXN",
      frequency,
      next_due_date: nextDueDate,
      description: description || undefined,
    };
    const result = isEdit
      ? await updateSubscription(editSubscription!.id, formData)
      : await createSubscription(formData);
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
          <DialogTitle>{isEdit ? "Editar suscripción" : "Nueva suscripción"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Netflix, gym..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequency">Frecuencia</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as SubscriptionFrequency)}>
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(SUBSCRIPTION_FREQUENCY_LABELS) as [SubscriptionFrequency, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="next_due_date">Próximo pago</Label>
            <Input
              id="next_due_date"
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Notas (opcional)</Label>
            <Textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
