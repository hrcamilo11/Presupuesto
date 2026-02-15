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
import { TAX_PERIOD_LABELS } from "@/lib/database.types";
import { deleteTaxObligation, markTaxPaid } from "@/app/actions/tax";
import { TaxForm } from "./tax-form";
import type { TaxObligation } from "@/lib/database.types";
import { Pencil, Trash2, Check } from "lucide-react";
import { formatDateYMD, formatNumber } from "@/lib/utils";

type Props = { taxes: TaxObligation[] };

export function TaxList({ taxes }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TaxObligation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedTax, setSelectedTax] = useState<TaxObligation | null>(null);

  async function handleDelete(id: string) {
    await deleteTaxObligation(id);
    setDeleteId(null);
    router.refresh();
  }

  async function handleMarkPaid(id: string) {
    await markTaxPaid(id, new Date().toISOString().slice(0, 10));
    router.refresh();
  }

  const pending = taxes.filter((t) => !t.paid_at);
  const totalPending = pending.reduce((s, t) => s + Number(t.amount), 0);

  return (
    <>
      {totalPending > 0 && (
        <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">
          Total pendiente por pagar: ${formatNumber(totalPending)}
        </p>
      )}
      {taxes.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No hay obligaciones fiscales. Agrega ISR, IVA, predial, etc.
        </p>
      ) : (
        <>
          {/* Vista en pantallas pequeñas/medianas: tarjetas para evitar scroll horizontal */}
          <div className="space-y-3 lg:hidden">
            {taxes.map((t) => (
              <div
                key={t.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setSelectedTax(t)}
                  className="flex-1 min-w-0 text-left focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-inset rounded-lg"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{t.name}</span>
                    <span className="text-sm font-semibold text-primary shrink-0">
                      ${formatNumber(Number(t.amount))}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{TAX_PERIOD_LABELS[t.period_type]}</span>
                    <span>{formatDateYMD(t.due_date)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.paid_at
                      ? `Pagado ${formatDateYMD(t.paid_at)}`
                      : "Pendiente"}
                  </p>
                </button>
                <div className="flex gap-1 shrink-0">
                  {!t.paid_at && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMarkPaid(t.id)}
                      title="Marcar como pagado"
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setEditing(t); setFormOpen(true); }}
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(t.id)}
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
                  <TableHead>Periodo</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxes.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      ${formatNumber(Number(t.amount))}
                    </TableCell>
                    <TableCell>{TAX_PERIOD_LABELS[t.period_type]}</TableCell>
                    <TableCell>{formatDateYMD(t.due_date)}</TableCell>
                    <TableCell>
                      {t.paid_at
                        ? `Pagado ${formatDateYMD(t.paid_at)}`
                        : "Pendiente"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!t.paid_at && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMarkPaid(t.id)}
                            title="Marcar como pagado"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(t);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(t.id)}
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
        </>
      )}
      <TaxForm open={formOpen} onOpenChange={setFormOpen} editTax={editing} />

      {/* Detalle en modal para móviles / clic en card */}
      <Dialog
        open={!!selectedTax}
        onOpenChange={(o) => {
          if (!o) setSelectedTax(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de obligación</DialogTitle>
          </DialogHeader>
          {selectedTax && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Nombre:</span>
                <span className="font-medium truncate">{selectedTax.name}</span>
                <span className="text-muted-foreground">Monto:</span>
                <span className="font-semibold">
                  ${formatNumber(Number(selectedTax.amount))}
                </span>
                <span className="text-muted-foreground">Periodo:</span>
                <span>{TAX_PERIOD_LABELS[selectedTax.period_type]}</span>
                <span className="text-muted-foreground">Vencimiento:</span>
                <span>{formatDateYMD(selectedTax.due_date)}</span>
                <span className="text-muted-foreground">Estado:</span>
                <span>
                  {selectedTax.paid_at
                    ? `Pagado ${formatDateYMD(selectedTax.paid_at)}`
                    : "Pendiente"}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar obligación</DialogTitle>
            <DialogDescription>¿Eliminar esta obligación fiscal?</DialogDescription>
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
