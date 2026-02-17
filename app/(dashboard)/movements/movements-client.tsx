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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por descripción, categoría o cuenta..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[180px]">
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

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Descripción / Categoría</TableHead>
                            <TableHead>Cuenta</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMovements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No se encontraron movimientos.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMovements.map((m) => {
                                const info = getKindInfo(m.kind);
                                const Icon = info.icon;
                                return (
                                    <TableRow key={m.id}>
                                        <TableCell className="whitespace-nowrap text-xs">
                                            {formatDateYMD(m.date)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={`${info.badge} border-none font-medium`}>
                                                    <Icon className="mr-1 h-3 w-3" />
                                                    {info.label}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">
                                                    {m.description || "Sin descripción"}
                                                </span>
                                                {('category' in m && m.category) && (
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                        {m.category}
                                                    </span>
                                                )}
                                                {m.kind === "investment" && m.goalName && (
                                                    <span className="text-[10px] text-purple-600 dark:text-purple-400 italic">
                                                        Meta: {m.goalName}
                                                    </span>
                                                )}
                                                {m.kind === "transfer_out" && m.toWalletName && (
                                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 italic">
                                                        Hacia: {m.toWalletName}
                                                    </span>
                                                )}
                                                {m.kind === "transfer_in" && m.fromWalletName && (
                                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 italic">
                                                        Desde: {m.fromWalletName}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">
                                            {m.walletName || "-"}
                                        </TableCell>
                                        <TableCell className={`text-right font-bold tabular-nums ${m.kind === 'income' ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
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
