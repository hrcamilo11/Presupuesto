import { redirect } from "next/navigation";
import Link from "next/link";
import { getWalletMovementHistory } from "@/app/actions/wallets";
import { WalletHistoryList } from "@/components/wallets/wallet-history-list";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function WalletHistoryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const { data: movements, wallet, error } = await getWalletMovementHistory(id);

    if (error || !wallet) {
        redirect("/wallets");
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/wallets" aria-label="Volver a cuentas">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Historial de movimientos</h1>
                        <p className="text-muted-foreground">{wallet.name}</p>
                    </div>
                </div>
            </div>

            <WalletHistoryList movements={movements} currency={wallet.currency} />
        </div>
    );
}
