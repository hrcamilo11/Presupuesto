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
import { useToast } from "@/components/ui/use-toast";

type Props = { subscriptions: Subscription[] };

export function SubscriptionList({ subscriptions }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  async function handleDelete(id: string) {
    const { error } = await deleteSubscription(id);
    setDeleteId(null);
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Suscripción eliminada",
        description: "La suscripción se ha eliminado correctamente.",
      });
      router.refresh();
    }
  }

  async function handleMarkPaid(id: string) {
    setPayingId(id);
    const { error } = await markSubscriptionPaid(id);
    setPayingId(null);

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Suscripción pagada",
        description: "Se ha registrado el pago de la suscripción.",
      });
      router.refresh();
    }
  }

  const totalMonthly = subscriptions.reduce((sum, s) => {
    const amt = Number(s.amount);
    return sum + (s.frequency === "yearly" ? amt / 12 : amt);
  }, 0);

  return (
    <>
      {subscriptions.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No hay suscripciones. Agrega una para llevar el control.
        </p>
      ) : (
        <>
          {/* Vista en pantallas pequeñas/medianas: tarjetas para evitar scroll horizontal */}
          <div className="space-y-3 lg:hidden">
            {subscriptions.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setSelectedSubscription(s)}
                  className="flex-1 min-w-0 text-left focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-inset rounded-lg"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{s.name}</span>
                    <span className="text-sm font-semibold text-primary shrink-0">
                      ${formatNumber(Number(s.amount))}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{SUBSCRIPTION_FREQUENCY_LABELS[s.frequency]}</span>
                    <span>{formatDateYMD(s.next_due_date)}</span>
                  </div>
                </button>
                <div className="flex gap-1 shrink-0">
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
                    onClick={() => { setEditing(s); setFormOpen(true); }}
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(s.id)}
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Vista de escritorio (cuando cabe la tabla): lista en tabla */}
          <div className="hidden lg:block overflow-x-auto">
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
