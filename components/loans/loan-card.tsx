"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAmortizationSchedule, monthlyPayment } from "@/lib/amortization";
import { recordLoanPayment, deleteLoan } from "@/app/actions/loans";
import type { Loan } from "@/lib/database.types";
import type { LoanPayment } from "@/lib/database.types";
import { Pencil, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { LoanForm } from "./loan-form";

type Props = {
  loan: Loan;
  payments: LoanPayment[];
};

export function LoanCard({ loan, payments }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [principalPortion, setPrincipalPortion] = useState("");
  const [interestPortion, setInterestPortion] = useState("");
  const [balanceAfter, setBalanceAfter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schedule = getAmortizationSchedule(
    Number(loan.principal),
    Number(loan.annual_interest_rate),
    loan.term_months,
    loan.start_date
  );
  const monthly = monthlyPayment(Number(loan.principal), Number(loan.annual_interest_rate), loan.term_months);
  const nextPayment = schedule[payments.length];
  const balanceRemaining = nextPayment ? nextPayment.balanceAfter : 0;

  async function handleRecordPayment() {
    setError(null);
    setSubmitting(true);
    const result = await recordLoanPayment(loan.id, {
      paid_at: paidAt,
      amount: Number(amount),
      principal_portion: Number(principalPortion),
      interest_portion: Number(interestPortion),
      balance_after: Number(balanceAfter),
    });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setRecordOpen(false);
    setAmount("");
    setPrincipalPortion("");
    setInterestPortion("");
    setBalanceAfter("");
    router.refresh();
  }

  function openRecordWithSuggested() {
    if (nextPayment) {
      setPaidAt(new Date().toISOString().slice(0, 10));
      setAmount(String(nextPayment.payment.toFixed(2)));
      setPrincipalPortion(String(nextPayment.principalPortion.toFixed(2)));
      setInterestPortion(String(nextPayment.interestPortion.toFixed(2)));
      setBalanceAfter(String(nextPayment.balanceAfter.toFixed(2)));
    }
    setRecordOpen(true);
  }

  async function handleDelete() {
    await deleteLoan(loan.id);
    setDeleteConfirm(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{loan.name}</CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setFormOpen(true)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(true)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Capital: ${Number(loan.principal).toLocaleString("es-CO", { minimumFractionDigits: 0 })} ·
          Tasa: {Number(loan.annual_interest_rate)}% anual ·
          Cuota: ${monthly.toLocaleString("es-CO", { minimumFractionDigits: 0 })}/mes
        </p>
        <p className="text-sm">
          Pagos realizados: {payments.length} / {loan.term_months} ·
          Saldo restante: ${balanceRemaining.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
        </p>
        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={openRecordWithSuggested} disabled={!nextPayment}>
            <Plus className="mr-1 h-4 w-4" /> Registrar pago
          </Button>
          <Button size="sm" variant="outline" onClick={() => setScheduleOpen(!scheduleOpen)}>
            {scheduleOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} Tabla de amortización
          </Button>
        </div>
        {scheduleOpen && (
          <div className="overflow-x-auto pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Cuota</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Interés</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((row) => (
                  <TableRow key={row.paymentNumber}>
                    <TableCell>{row.paymentNumber}</TableCell>
                    <TableCell>{new Date(row.dueDate).toLocaleDateString("es")}</TableCell>
                    <TableCell className="text-right">${row.payment.toLocaleString("es-CO", { minimumFractionDigits: 0 })}</TableCell>
                    <TableCell className="text-right">${row.principalPortion.toLocaleString("es-CO", { minimumFractionDigits: 0 })}</TableCell>
                    <TableCell className="text-right">${row.interestPortion.toLocaleString("es-CO", { minimumFractionDigits: 0 })}</TableCell>
                    <TableCell className="text-right">${row.balanceAfter.toLocaleString("es-CO", { minimumFractionDigits: 0 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <LoanForm open={formOpen} onOpenChange={setFormOpen} editLoan={loan} />

      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>}
            <div className="space-y-2">
              <Label>Fecha de pago</Label>
              <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto total</Label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Principal</Label>
                <Input type="number" step="0.01" value={principalPortion} onChange={(e) => setPrincipalPortion(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Interés</Label>
                <Input type="number" step="0.01" value={interestPortion} onChange={(e) => setInterestPortion(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Saldo después</Label>
                <Input type="number" step="0.01" value={balanceAfter} onChange={(e) => setBalanceAfter(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordOpen(false)}>Cancelar</Button>
            <Button onClick={handleRecordPayment} disabled={submitting}>Guardar pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar préstamo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">¿Eliminar este préstamo y su historial de pagos? No se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
