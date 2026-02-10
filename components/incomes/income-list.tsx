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
import type { Income, SharedAccount, Wallet, Category } from "@/lib/database.types";
import { Pencil, Trash2 } from "lucide-react";

type IncomeListProps = {
  incomes: Income[];
  year: number;
  month: number;
  sharedAccounts: SharedAccount[];
  wallets: Wallet[];
  categories: Category[];
};

export function IncomeList({ incomes, year, month, sharedAccounts, wallets, categories }: IncomeListProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);

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
        <p className="py-8 text-center text-muted-foreground">
          No hay ingresos este mes. Agrega uno para comenzar.
        </p>
      ) : (
        <>
          {/* Vista móvil: cards sin tabla */}
          <div className="space-y-3 md:hidden">
            {incomes.map((income) => (
              <button
                key={income.id}
                type="button"
                onClick={() => setSelectedIncome(income)}
                className="w-full rounded-lg border bg-card p-3 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {new Date(income.date).toLocaleDateString("es")}
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    ${Number(income.amount).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">
                    {INCOME_TYPE_LABELS[income.income_type]}
                  </span>
                  <span className="truncate">
                    {categories.find((c) => c.id === income.category_id)?.name || "—"}
                  </span>
                </div>
                {income.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {income.description}
                  </p>
                )}
              </button>
            ))}
          </div>

          {/* Vista de escritorio: tabla completa */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoría</TableHead>
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
                    <TableCell>
                      {categories.find((c) => c.id === income.category_id)?.name || "—"}
                    </TableCell>
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
          </div>

          <p className="mt-2 text-sm font-medium">
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
        categories={categories}
      />

      {/* Detalle en modal para móviles / clic en card */}
      <Dialog
        open={!!selectedIncome}
        onOpenChange={(open) => {
          if (!open) setSelectedIncome(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de ingreso</DialogTitle>
          </DialogHeader>
          {selectedIncome && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Fecha:</span>
                <span>
                  {new Date(selectedIncome.date).toLocaleDateString("es")}
                </span>
                <span className="text-muted-foreground">Monto:</span>
                <span className="font-semibold">
                  ${Number(selectedIncome.amount).toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                </span>
                <span className="text-muted-foreground">Tipo:</span>
                <span>{INCOME_TYPE_LABELS[selectedIncome.income_type]}</span>
                <span className="text-muted-foreground">Categoría:</span>
                <span>
                  {categories.find((c) => c.id === selectedIncome.category_id)?.name || "—"}
                </span>
              </div>
              {selectedIncome.description && (
                <div>
                  <span className="text-xs text-muted-foreground">Descripción:</span>
                  <p className="mt-1 text-sm">
                    {selectedIncome.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
