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
import { EXPENSE_PRIORITY_LABELS } from "@/lib/database.types";
import { deleteExpense } from "@/app/actions/expenses";
import { ExpenseForm } from "./expense-form";
import type { Expense, SharedAccount, Wallet } from "@/lib/database.types";
import { Pencil, Trash2 } from "lucide-react";

type ExpenseListProps = {
  expenses: Expense[];
  year: number;
  month: number;
  sharedAccounts: SharedAccount[];
  wallets: Wallet[];
};

export function ExpenseList({ expenses, year, month, sharedAccounts, wallets }: ExpenseListProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(id: string) {
    setDeleting(true);
    await deleteExpense(id);
    setDeleting(false);
    setDeleteId(null);
    router.refresh();
  }

  function openEdit(expense: Expense) {
    setEditing(expense);
    setFormOpen(true);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Gastos — {new Date(year, month - 1).toLocaleString("es", { month: "long", year: "numeric" })}
        </h2>
        <Button onClick={openCreate}>Agregar gasto</Button>
      </div>

      {expenses.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No hay gastos este mes. Agrega uno para comenzar.
        </p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    {new Date(expense.date).toLocaleDateString("es")}
                  </TableCell>
                  <TableCell>{EXPENSE_PRIORITY_LABELS[expense.expense_priority]}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {expense.description || "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${Number(expense.amount).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(expense)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(expense.id)}
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

      <ExpenseForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        editExpense={editing}
        sharedAccounts={sharedAccounts}
        wallets={wallets}
      />

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar gasto</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres eliminar este gasto? No se puede deshacer.
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
