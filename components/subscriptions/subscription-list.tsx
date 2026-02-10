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
import { formatDateYMD, formatNumber } from "@/lib/utils";

type Props = { subscriptions: Subscription[] };

export function SubscriptionList({ subscriptions }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

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
        <p className="py-8 text-center text-muted-foreground">
          No hay suscripciones. Agrega una para llevar el control.
        </p>
      ) : (
        <>
          {/* Vista móvil: cards sin tabla */}
          <div className="space-y-3 md:hidden">
            {subscriptions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSubscription(s)}
                className="w-full rounded-lg border bg-card p-3 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{s.name}</span>
                  <span className="text-sm font-semibold text-primary">
                    ${formatNumber(Number(s.amount))}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{SUBSCRIPTION_FREQUENCY_LABELS[s.frequency]}</span>
                  <span>{formatDateYMD(s.next_due_date)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Vista de escritorio: tabla completa */}
          <div className="hidden md:block">
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
                    <TableCell>
                      ${formatNumber(Number(s.amount))}
                    </TableCell>
                    <TableCell>{SUBSCRIPTION_FREQUENCY_LABELS[s.frequency]}</TableCell>
                    <TableCell>{formatDateYMD(s.next_due_date)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMarkPaid(s.id)}
                          disabled={!!payingId}
                          title="Marcar como pagado"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(s);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(s.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="mt-2 text-sm font-medium">
            Total equivalente mensual: ${formatNumber(totalMonthly)}
          </p>
        </>
      )}
      <SubscriptionForm open={formOpen} onOpenChange={setFormOpen} editSubscription={editing} />

      {/* Detalle en modal para móviles / clic en card */}
      <Dialog
        open={!!selectedSubscription}
        onOpenChange={(o) => {
          if (!o) setSelectedSubscription(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de suscripción</DialogTitle>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Nombre:</span>
                <span className="font-medium truncate">{selectedSubscription.name}</span>
                <span className="text-muted-foreground">Monto:</span>
                <span className="font-semibold">
                  ${formatNumber(Number(selectedSubscription.amount))}
                </span>
                <span className="text-muted-foreground">Frecuencia:</span>
                <span>{SUBSCRIPTION_FREQUENCY_LABELS[selectedSubscription.frequency]}</span>
                <span className="text-muted-foreground">Próximo pago:</span>
                <span>{formatDateYMD(selectedSubscription.next_due_date)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
