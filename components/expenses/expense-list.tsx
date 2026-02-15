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
import type { Expense, SharedAccount, Wallet, Category } from "@/lib/database.types";
import { Pencil, Trash2, MessageCircle } from "lucide-react";
import { ExpenseComments } from "./expense-comments";
import { formatDateYMD, formatNumber } from "@/lib/utils";

type ExpenseListProps = {
  expenses: Expense[];
  year: number;
  month: number;
  sharedAccounts: SharedAccount[];
  wallets: Wallet[];
  categories: Category[];
};

export function ExpenseList({ expenses, year, month, sharedAccounts, wallets, categories }: ExpenseListProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedExpenseForComments, setSelectedExpenseForComments] = useState<Expense | null>(null);

  async function handleDelete(id: string) {
    setDeleting(true);
    await deleteExpense(id);
    setDeleting(false);
    setDeleteId(null);
    router.refresh();
  }

  function openEdit(expense: Expense) {
    setEditingExpense(expense);
    setFormOpen(true);
  }

  function openCreate() {
    setEditingExpense(null);
    setFormOpen(true);
  }

  const totalAmount = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Gastos — {month}/{year}
        </h2>
        <Button onClick={openCreate}>Agregar gasto</Button>
      </div>

      {expenses.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No hay gastos este mes. Agrega uno para comenzar.
        </p>
      ) : (
        <>
          {/* Vista en pantallas pequeñas/medianas: tarjetas para evitar scroll horizontal */}
          <div className="space-y-3 lg:hidden">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setSelectedExpenseForComments(expense)}
                  className="flex-1 min-w-0 text-left focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-inset rounded-lg"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {formatDateYMD(expense.date)}
                    </span>
                    <span className="text-sm font-semibold text-primary shrink-0">
                      ${formatNumber(Number(expense.amount))}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="truncate">
                      {EXPENSE_PRIORITY_LABELS[expense.expense_priority]}
                    </span>
                    <span className="truncate">
                      {categories.find((c) => c.id === expense.category_id)?.name || "—"}
                    </span>
                  </div>
                  {expense.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {expense.description}
                    </p>
                  )}
                </button>
                <div className="flex gap-1 shrink-0 sm:flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedExpenseForComments(expense)}
                    title="Comentarios"
                  >
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
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
              </div>
            ))}
          </div>

          {/* Vista de escritorio (cuando cabe la tabla): lista en tabla */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {formatDateYMD(expense.date)}
                    </TableCell>
                    <TableCell>{EXPENSE_PRIORITY_LABELS[expense.expense_priority]}</TableCell>
                    <TableCell>
                      {categories.find((c) => c.id === expense.category_id)?.name || "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {expense.description || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${formatNumber(Number(expense.amount))}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedExpenseForComments(expense)}
                          title="Ver comentarios"
                        >
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
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
          </div>

          <p className="mt-2 text-sm font-medium">
            Total: ${formatNumber(totalAmount)}
          </p>
        </>
      )}

      <ExpenseForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingExpense(null);
        }}
        editExpense={editingExpense}
        sharedAccounts={sharedAccounts}
        wallets={wallets}
        categories={categories}
      />

      <Dialog
        open={!!selectedExpenseForComments}
        onOpenChange={(open) => {
          if (!open) setSelectedExpenseForComments(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del Gasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Monto:</span>
              <span className="font-bold">
                ${formatNumber(Number(selectedExpenseForComments?.amount || 0))}
              </span>
              <span className="text-muted-foreground">Fecha:</span>
              <span>
                {selectedExpenseForComments?.date
                  ? formatDateYMD(selectedExpenseForComments.date)
                  : "—"}
              </span>
              <span className="text-muted-foreground">Categoría:</span>
              <span>{categories.find(c => c.id === selectedExpenseForComments?.category_id)?.name || "—"}</span>
            </div>
            {selectedExpenseForComments && (
              <ExpenseComments expenseId={selectedExpenseForComments.id} />
            )}
          </div>
        </DialogContent>
      </Dialog>

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
