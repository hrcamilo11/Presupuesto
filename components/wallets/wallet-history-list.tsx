"use client";

import { formatCurrency } from "@/lib/utils";
import type { WalletMovement } from "@/app/actions/wallets";
import { TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export function WalletHistoryList({
    movements,
    currency,
}: {
    movements: WalletMovement[];
    currency: string;
}) {
    if (movements.length === 0) {
        return (
            <div className="rounded-xl border border-border/80 bg-card p-8 text-center text-muted-foreground">
                No hay movimientos en los últimos 90 días.
            </div>
        );
    }

    const label = (m: WalletMovement) => {
        switch (m.kind) {
            case "income":
                return "Ingreso";
            case "expense":
                return "Gasto";
            case "transfer_out":
                return m.toWalletName ? `Transferencia a ${m.toWalletName}` : "Transferencia enviada";
            case "transfer_in":
                return m.fromWalletName ? `Transferencia de ${m.fromWalletName}` : "Transferencia recibida";
            default:
                return "";
        }
    };

    const amountSign = (m: WalletMovement) => {
        if (m.kind === "income" || m.kind === "transfer_in") return 1;
        return -1;
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Últimos 90 días · {movements.length} movimiento{movements.length !== 1 ? "s" : ""}
            </p>
            <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="max-w-[200px]">Descripción</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {movements.map((m) => {
                                const sign = amountSign(m);
                                const amount = m.amount * sign;
                                const isPositive = amount >= 0;
                                return (
                                    <TableRow key={`${m.kind}-${m.id}`}>
                                        <TableCell className="whitespace-nowrap text-muted-foreground">
                                            {new Date(m.date).toLocaleDateString("es-CO", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <span className="flex items-center gap-1.5">
                                                {m.kind === "income" && <TrendingUp className="h-4 w-4 text-green-600" />}
                                                {m.kind === "expense" && <TrendingDown className="h-4 w-4 text-red-600" />}
                                                {(m.kind === "transfer_in" || m.kind === "transfer_out") && (
                                                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                {label(m)}
                                                {("category" in m && m.category) && (
                                                    <span className="text-xs text-muted-foreground">· {m.category}</span>
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                            {m.description || "—"}
                                        </TableCell>
                                        <TableCell
                                            className={`text-right font-medium tabular-nums ${
                                                isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                            }`}
                                        >
                                            {isPositive ? "+" : ""}
                                            {formatCurrency(amount, currency)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
