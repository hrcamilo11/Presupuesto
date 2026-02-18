import { getWallets } from "@/app/actions/wallets";
import { WalletForm } from "@/components/wallets/wallet-form";
import { LineChart } from "lucide-react";
import type { Wallet } from "@/lib/database.types";
import { SortableWalletList } from "@/components/wallets/sortable-wallet-list";

export default async function InvestmentsPage() {
    const { data: allWallets, error } = await getWallets();
    const wallets = (allWallets as Wallet[]).filter(w => w.type === "investment");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inversiones</h1>
                    <p className="text-muted-foreground">
                        Administra tus certificados de depósito, acciones y otros rendimientos.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <WalletForm allowedTypes={["investment"]} />
                </div>
            </div>

            {error ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    Error al cargar inversiones: {error}
                </div>
            ) : wallets.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <LineChart className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No tienes inversiones</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        Registra tu primera inversión para empezar a ver tus rendimientos.
                    </p>
                    <WalletForm allowedTypes={["investment"]} />
                </div>
            ) : (
                <SortableWalletList initialWallets={wallets} />
            )}
        </div>
    );
}
