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

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {wallet.name}
                </CardTitle>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
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
                    <div className="p-2 bg-primary/10 rounded-full">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{formatCurrency(wallet.balance, wallet.currency)}</div>
                        <p className="text-xs text-muted-foreground capitalize">{label}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
