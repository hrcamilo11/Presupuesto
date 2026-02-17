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
import { formatDateYMD, formatNumber } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

type IncomeListProps = {
  incomes: Income[];
  sharedAccounts: SharedAccount[];
  wallets: Wallet[];
  categories: Category[];
};

export function IncomeList({ incomes, sharedAccounts, wallets, categories }: IncomeListProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const { toast } = useToast();

  async function handleDelete(id: string) {
    setDeleting(true);
    await deleteIncome(id);
    toast({
      title: "Ingreso eliminado",
      description: "El ingreso se ha eliminado correctamente.",
    });
    setDeleting(false);
    setDeleteId(null);
    router.refresh();
  }

  function openEdit(income: Income) {
    setEditing(income);
    setFormOpen(true);
  }

  const total = incomes.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <>
      {incomes.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No hay ingresos este mes. Agrega uno para comenzar.
        </p>
      ) : (
        <>
          {/* Vista en pantallas pequeñas/medianas: tarjetas para evitar scroll horizontal */}
          <div className="space-y-3 lg:hidden">
            {incomes.map((income) => (
              <div
                key={income.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setSelectedIncome(income)}
                  className="flex-1 min-w-0 text-left focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-inset rounded-lg"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {formatDateYMD(income.date)}
                    </span>
                    <span className="text-sm font-semibold text-primary shrink-0">
                      ${formatNumber(Number(income.amount))}
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
                <div className="flex gap-1 shrink-0">
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
              </div>
            ))}
          </div>

          {/* Vista de escritorio (cuando cabe la tabla): lista en tabla */}
          <div className="hidden lg:block overflow-x-auto">
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
                      {formatDateYMD(income.date)}
                    </TableCell>
                    <TableCell>{INCOME_TYPE_LABELS[income.income_type]}</TableCell>
                    <TableCell>
                      {categories.find((c) => c.id === income.category_id)?.name || "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {income.description || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${formatNumber(Number(income.amount))}
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
            Total: ${formatNumber(total)}
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
                <span>{formatDateYMD(selectedIncome.date)}</span>
                <span className="text-muted-foreground">Monto:</span>
                <span className="font-semibold">
                  ${formatNumber(Number(selectedIncome.amount))}
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
