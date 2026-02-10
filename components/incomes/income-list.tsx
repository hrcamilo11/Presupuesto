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
import { INCOME_TYPE_LABELS } from "@/lib/database.types";
import { deleteIncome } from "@/app/actions/incomes";
import { IncomeForm } from "./income-form";
import type { Income, SharedAccount, Wallet } from "@/lib/database.types";
import { Pencil, Trash2 } from "lucide-react";

type IncomeListProps = {
  incomes: Income[];
  year: number;
  month: number;
  sharedAccounts: SharedAccount[];
  wallets: Wallet[];
};

export function IncomeList({ incomes, year, month, sharedAccounts, wallets }: IncomeListProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(id: string) {
    setDeleting(true);
    await deleteIncome(id);
    setDeleting(false);
    setDeleteId(null);
    router.refresh();
  }

  function openEdit(income: Income) {
    setEditing(income);
    setFormOpen(true);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  const total = incomes.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Ingresos — {new Date(year, month - 1).toLocaleString("es", { month: "long", year: "numeric" })}
        </h2>
        <Button onClick={openCreate}>Agregar ingreso</Button>
      </div>

      {incomes.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No hay ingresos este mes. Agrega uno para comenzar.
        </p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomes.map((income) => (
                <TableRow key={income.id}>
                  <TableCell>
                    {new Date(income.date).toLocaleDateString("es")}
                  </TableCell>
                  <TableCell>{INCOME_TYPE_LABELS[income.income_type]}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {income.description || "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${Number(income.amount).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(income)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(income.id)}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-sm font-medium mt-2">
            Total: ${total.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
          </p>
        </>
      )}

      <IncomeForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        editIncome={editing}
        sharedAccounts={sharedAccounts}
        wallets={wallets}
      />

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar ingreso</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres eliminar este ingreso? No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
