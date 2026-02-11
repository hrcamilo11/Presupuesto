"use client";

import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
    getCreditCardAmortizationSchedule,
    type CreditCardAmortizationRow,
} from "@/lib/credit-card";
import { formatCurrency } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface CreditCardAmortizationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    balance: number;
    /** Tasa de interés de compras: % mensual (ej. 2.3). Se convierte a anual para el cálculo. */
    monthlyRatePercent: number;
    currency: string;
}

export function CreditCardAmortizationDialog({
    open,
    onOpenChange,
    balance,
    monthlyRatePercent,
    currency,
}: CreditCardAmortizationDialogProps) {
    const [monthlyPaymentInput, setMonthlyPaymentInput] = useState("");

    const annualRate = (monthlyRatePercent || 0) * 12;
    const suggestedPayment = useMemo(() => {
        if (balance <= 0) return 0;
        const r = annualRate / 12 / 100;
        if (r <= 0) return balance / 12;
        const minToCoverInterest = balance * r;
        return Math.ceil(minToCoverInterest * 1.2 * 100) / 100;
    }, [balance, annualRate]);

    const payment = useMemo(() => {
        const v = Number(monthlyPaymentInput);
        return v > 0 ? v : suggestedPayment;
    }, [monthlyPaymentInput, suggestedPayment]);

    const schedule = useMemo((): CreditCardAmortizationRow[] => {
        if (balance <= 0) return [];
        return getCreditCardAmortizationSchedule(
            balance,
            annualRate,
            payment,
            new Date()
        );
    }, [balance, annualRate, payment]);

    const totalInterest = useMemo(
        () => schedule.reduce((s, r) => s + r.interest, 0),
        [schedule]
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Tabla de amortización</DialogTitle>
                </DialogHeader>

                <div className="space-y-2">
                    <Label>Pago mensual fijo (opcional)</Label>
                    <CurrencyInput
                        value={monthlyPaymentInput}
                        onChange={(v) => setMonthlyPaymentInput(String(v))}
                        placeholder={String(suggestedPayment)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Sugerido (cubre intereses + algo a capital):{" "}
                        {formatCurrency(suggestedPayment, currency)}/mes. Deuda:{" "}
                        {formatCurrency(balance, currency)} · Tasa anual aprox.{" "}
                        {annualRate.toFixed(1)}%.
                    </p>
                </div>

                {schedule.length > 0 && (
                    <>
                        <p className="text-sm text-muted-foreground">
                            {schedule.length} cuotas · Interés total:{" "}
                            {formatCurrency(totalInterest, currency)}
                        </p>
                        <div className="flex-1 overflow-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Vencimiento</TableHead>
                                        <TableHead className="text-right">
                                            Cuota
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Interés
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Capital
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Saldo
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {schedule.map((row) => (
                                        <TableRow key={row.month}>
                                            <TableCell>{row.month}</TableCell>
                                            <TableCell>{row.dueDate}</TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    row.payment,
                                                    currency
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    row.interest,
                                                    currency
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    row.principal,
                                                    currency
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(
                                                    row.balanceAfter,
                                                    currency
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}

                {balance > 0 && schedule.length === 0 && (
                    <p className="text-sm text-amber-600">
                        El pago mensual debe ser mayor al interés del primer mes
                        para poder generar la tabla.
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}
