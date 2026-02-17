import { getWallets } from "@/app/actions/wallets";
import { WalletForm } from "@/components/wallets/wallet-form";
import { WalletCard } from "@/components/wallets/wallet-card";
import { TransferFormWrapper } from "@/components/wallets/transfer-form-wrapper";

export default async function WalletsPage() {
    const { data: allWallets, error } = await getWallets();
    const wallets = allWallets.filter(w => w.type !== "investment");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cuentas</h1>
                    <p className="text-muted-foreground">
                        Administra tus cuentas bancarias, efectivo y crédito.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {wallets.length > 1 && <TransferFormWrapper wallets={wallets} />}
                    <WalletForm allowedTypes={["cash", "debit", "credit"]} />
                </div>
            </div>

            {error ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    Error al cargar cuentas: {error}
                </div>
            ) : wallets.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="h-6 w-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
                            />
                        </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No tienes cuentas</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        Registra tu primera cuenta para empezar a organizar tu dinero.
                    </p>
                    <WalletForm />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {wallets.map((wallet) => (
                        <WalletCard key={wallet.id} wallet={wallet} wallets={wallets} />
                    ))}
                </div>
            )}
        </div>
    );
}
