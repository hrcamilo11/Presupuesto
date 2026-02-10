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

type Props = { taxes: TaxObligation[] };

export function TaxList({ taxes }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TaxObligation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Obligaciones fiscales</h2>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>Agregar obligación</Button>
      </div>
      {totalPending > 0 && (
        <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">
          Total pendiente por pagar: ${totalPending.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
        </p>
      )}
      {taxes.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">No hay obligaciones fiscales. Agrega ISR, IVA, predial, etc.</p>
      ) : (
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
                <TableCell>${Number(t.amount).toLocaleString("es-CO", { minimumFractionDigits: 0 })}</TableCell>
                <TableCell>{TAX_PERIOD_LABELS[t.period_type]}</TableCell>
                <TableCell>{new Date(t.due_date).toLocaleDateString("es")}</TableCell>
                <TableCell>{t.paid_at ? `Pagado ${new Date(t.paid_at).toLocaleDateString("es")}` : "Pendiente"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {!t.paid_at && (
                      <Button variant="ghost" size="icon" onClick={() => handleMarkPaid(t.id)} title="Marcar como pagado">
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <TaxForm open={formOpen} onOpenChange={setFormOpen} editTax={editing} />
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
