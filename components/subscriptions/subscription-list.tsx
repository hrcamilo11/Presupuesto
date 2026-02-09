"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SUBSCRIPTION_FREQUENCY_LABELS } from "@/lib/database.types";
import { deleteSubscription, markSubscriptionPaid } from "@/app/actions/subscriptions";
import { SubscriptionForm } from "./subscription-form";
import type { Subscription } from "@/lib/database.types";
import { Pencil, Trash2, Check } from "lucide-react";

type Props = { subscriptions: Subscription[] };

export function SubscriptionList({ subscriptions }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    await deleteSubscription(id);
    setDeleteId(null);
    router.refresh();
  }

  async function handleMarkPaid(id: string) {
    setPayingId(id);
    await markSubscriptionPaid(id);
    setPayingId(null);
    router.refresh();
  }

  const totalMonthly = subscriptions.reduce((sum, s) => {
    const amt = Number(s.amount);
    return sum + (s.frequency === "yearly" ? amt / 12 : amt);
  }, 0);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Suscripciones</h2>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>Agregar suscripción</Button>
      </div>
      {subscriptions.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">No hay suscripciones. Agrega una para llevar el control.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Frecuencia</TableHead>
                <TableHead>Próximo pago</TableHead>
                <TableHead className="w-[140px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>${Number(s.amount).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{SUBSCRIPTION_FREQUENCY_LABELS[s.frequency]}</TableCell>
                  <TableCell>{new Date(s.next_due_date).toLocaleDateString("es")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleMarkPaid(s.id)} disabled={!!payingId} title="Marcar como pagado">
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-sm font-medium mt-2">Total equivalente mensual: ${totalMonthly.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
        </>
      )}
      <SubscriptionForm open={formOpen} onOpenChange={setFormOpen} editSubscription={editing} />
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar suscripción</DialogTitle>
            <DialogDescription>¿Eliminar esta suscripción? No se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
