"use client";

import { Wallet, CreditCard, Banknote, PiggyBank, TrendingUp, MoreHorizontal, Trash } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteWallet } from "@/app/actions/wallets";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface WalletProps {
    id: string;
    name: string;
    type: string;
    currency: string;
    balance: number;
    credit_mode?: "account" | "card" | null;
    card_brand?: string | null;
}

const typeIcons = {
    cash: Banknote,
    debit: CreditCard,
    credit: CreditCard,
    savings: PiggyBank,
    investment: TrendingUp,
};

const typeLabels = {
    cash: "Efectivo",
    debit: "Débito",
    credit: "Crédito",
    savings: "Ahorros",
    investment: "Inversión",
};

export function WalletCard({ wallet }: { wallet: WalletProps }) {
    const Icon = typeIcons[wallet.type as keyof typeof typeIcons] || Wallet;
    const label = typeLabels[wallet.type as keyof typeof typeLabels] || "Cuenta";
    const { toast } = useToast();
    const router = useRouter();

    async function handleDelete() {
        if (!confirm("¿Estás seguro de eliminar esta cuenta? Se perderá el historial asociado si no está respaldado (aunque la integridad referencial debería impedirlo si hay datos).")) return;

        const res = await deleteWallet(wallet.id);
        if (res.error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: res.error,
            });
        } else {
            toast({
                title: "Eliminado",
                description: "La cuenta ha sido eliminada.",
            });
            router.refresh();
        }
    }

    const isCreditCard = wallet.type === "credit" && wallet.credit_mode === "card";

    return (
        <Card className={isCreditCard ? "overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {isCreditCard && wallet.card_brand && (
                        <span className="rounded-full bg-slate-100/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border border-slate-500/40">
                            {wallet.card_brand}
                        </span>
                    )}
                    <span className="truncate">{wallet.name}</span>
                </CardTitle>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant={isCreditCard ? "ghost" : "ghost"} className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                            <Trash className="mr-2 h-4 w-4" />
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-4">
                    <div className={isCreditCard ? "rounded-xl bg-slate-700/70 p-3" : "p-2 bg-primary/10 rounded-full"}>
                        <Icon className={isCreditCard ? "h-7 w-7 text-slate-100" : "h-6 w-6 text-primary"} />
                    </div>
                    <div>
                        <div className={isCreditCard ? "text-2xl font-bold tracking-wide" : "text-2xl font-bold"}>
                            {formatCurrency(wallet.balance, wallet.currency)}
                        </div>
                        <p className={isCreditCard ? "text-[11px] text-slate-200/80 capitalize" : "text-xs text-muted-foreground capitalize"}>
                            {label}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
