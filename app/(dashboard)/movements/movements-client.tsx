"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { formatNumber, formatDateYMD } from "@/lib/utils";
import {
    ArrowUpCircle,
    ArrowDownCircle,
    ArrowLeftRight,
    TrendingUp,
    Search,
    Filter
} from "lucide-react";
import type { WalletMovement } from "@/app/actions/wallets";
import { Badge } from "@/components/ui/badge";

interface MovementsClientProps {
    initialMovements: WalletMovement[];
}

export function MovementsClient({ initialMovements }: MovementsClientProps) {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    const filteredMovements = initialMovements.filter((m) => {
        const matchesSearch = (m.description?.toLowerCase() || "").includes(search.toLowerCase()) ||
            (('category' in m && m.category) ? m.category.toLowerCase().includes(search.toLowerCase()) : false) ||
            (m.walletName?.toLowerCase() || "").includes(search.toLowerCase());

        const matchesType = typeFilter === "all" ||
            (typeFilter === "income" && m.kind === "income") ||
            (typeFilter === "expense" && m.kind === "expense") ||
            (typeFilter === "transfer" && (m.kind === "transfer_in" || m.kind === "transfer_out")) ||
            (typeFilter === "investment" && m.kind === "investment");

        return matchesSearch && matchesType;
    });

    const getKindInfo = (kind: WalletMovement["kind"]) => {
        switch (kind) {
            case "income":
                return {
                    label: "Ingreso",
                    icon: ArrowUpCircle,
                    color: "text-green-600",
                    badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                };
            case "expense":
                return {
                    label: "Gasto",
                    icon: ArrowDownCircle,
                    color: "text-red-600",
                    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                };
            case "transfer_in":
            case "transfer_out":
                return {
                    label: "Transferencia",
                    icon: ArrowLeftRight,
                    color: "text-blue-600",
                    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                };
            case "investment":
                return {
                    label: "Inversión",
                    icon: TrendingUp,
                    color: "text-purple-600",
                    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                };
            default:
                return {
                    label: "Otro",
                    icon: ArrowLeftRight,
                    color: "text-gray-600",
                    badge: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                };
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por descripción, categoría o cuenta..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-11 sm:h-10"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:flex-initial">
                            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full sm:w-[180px] pl-9 h-11 sm:h-10">
                                    <SelectValue placeholder="Filtrar por tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los tipos</SelectItem>
                                    <SelectItem value="income">Ingresos</SelectItem>
                                    <SelectItem value="expense">Gastos</SelectItem>
                                    <SelectItem value="transfer">Transferencias</SelectItem>
                                    <SelectItem value="investment">Inversiones</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Mobile View: Cards (grouped by date implicitly by sort) */}
                <div className="lg:hidden space-y-3">
                    {filteredMovements.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground bg-accent/20 rounded-xl border border-dashed">
                            No se encontraron movimientos.
                        </div>
                    ) : (
                        filteredMovements.map((m) => {
                            const info = getKindInfo(m.kind);
                            const Icon = info.icon;
                            const isIncome = m.kind === 'income';
                            return (
                                <div key={m.id} className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-full ${info.badge} border-none`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                                    {formatDateYMD(m.date)}
                                                </span>
                                                <h3 className="font-semibold text-sm leading-none mt-0.5">
                                                    {m.description || "Sin descripción"}
                                                </h3>
                                            </div>
                                        </div>
                                        <div className={`text-right font-bold tabular-nums ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                                            {isIncome ? '+' : '-'}${formatNumber(m.amount)}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 items-center mt-3">
                                        <Badge variant="outline" className={`${info.badge} border-none text-[10px] py-0 px-2 h-5`}>
                                            {info.label}
                                        </Badge>
                                        {('category' in m && m.category) && (
                                            <Badge variant="secondary" className="text-[10px] py-0 px-2 h-5 font-normal">
                                                {m.category}
                                            </Badge>
                                        )}
                                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
                                            <TrendingUp className="h-3 w-3" />
                                            <span>{m.walletName || "-"}</span>
                                        </div>
                                    </div>

                                    {m.kind === "investment" && m.goalName && (
                                        <div className="mt-2 text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded inline-block">
                                            Meta: {m.goalName}
                                        </div>
                                    )}
                                    {(m.kind === "transfer_out" || m.kind === "transfer_in") && (m.toWalletName || m.fromWalletName) && (
                                        <div className="mt-2 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded inline-flex items-center gap-1">
                                            <ArrowLeftRight className="h-3 w-3" />
                                            {m.kind === "transfer_out" ? `Hacia: ${m.toWalletName}` : `Desde: ${m.fromWalletName}`}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden lg:block rounded-xl border bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[120px]">Fecha</TableHead>
                                <TableHead className="w-[140px]">Tipo</TableHead>
                                <TableHead>Descripción / Categoría</TableHead>
                                <TableHead className="w-[150px]">Cuenta</TableHead>
                                <TableHead className="text-right w-[150px]">Monto</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMovements.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        No se encontraron movimientos.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMovements.map((m) => {
                                    const info = getKindInfo(m.kind);
                                    const Icon = info.icon;
                                    return (
                                        <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                                                {formatDateYMD(m.date)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`${info.badge} border-none font-medium h-6`}>
                                                    <Icon className="mr-1 h-3 w-3" />
                                                    {info.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col py-1">
                                                    <span className="font-semibold text-sm">
                                                        {m.description || "Sin descripción"}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {('category' in m && m.category) && (
                                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                                                {m.category}
                                                            </span>
                                                        )}
                                                        {m.kind === "investment" && m.goalName && (
                                                            <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1.5 rounded">
                                                                Meta: {m.goalName}
                                                            </span>
                                                        )}
                                                        {m.kind === "transfer_out" && m.toWalletName && (
                                                            <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 rounded">
                                                                Hacia: {m.toWalletName}
                                                            </span>
                                                        )}
                                                        {m.kind === "transfer_in" && m.fromWalletName && (
                                                            <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 rounded">
                                                                Desde: {m.fromWalletName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs font-medium text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                                    {m.walletName || "-"}
                                                </div>
                                            </TableCell>
                                            <TableCell className={`text-right font-bold tabular-nums text-sm ${m.kind === 'income' ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                                                {m.kind === 'income' ? '+' : '-'}${formatNumber(m.amount)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            );
}
