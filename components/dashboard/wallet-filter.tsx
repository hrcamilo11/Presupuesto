"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Wallet as WalletIcon } from "lucide-react";
import { Wallet } from "@/lib/database.types";

export function WalletFilter({ wallets }: { wallets: Wallet[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentWalletId = searchParams.get("wallet") || "all";

    function handleValueChange(value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "all") {
            params.delete("wallet");
        } else {
            params.set("wallet", value);
        }
        router.push(`/dashboard?${params.toString()}`);
    }

    return (
        <Select value={currentWalletId} onValueChange={handleValueChange}>
            <SelectTrigger className="w-[200px] rounded-lg border-input shadow-sm text-sm" aria-label="Filtrar por cuenta">
                <WalletIcon className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Todas las cuentas" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todas las cuentas</SelectItem>
                {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
