import { getSavingsGoals } from "@/app/actions/savings";
import { getWallets } from "@/app/actions/wallets";
import { SavingsGoalForm } from "@/components/savings/savings-form";
import { SavingsCard } from "@/components/savings/savings-card";

export default async function SavingsPage() {
    const { data: goals, error } = await getSavingsGoals();
    const { data: wallets } = await getWallets();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Metas de Ahorro</h1>
                    <p className="text-muted-foreground">
                        Define tus objetivos y guarda dinero para alcanzarlos.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <SavingsGoalForm wallets={wallets} />
                </div>
            </div>

            {error ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    Error al cargar metas: {error}
                </div>
            ) : goals.length === 0 ? (
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
                                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No tienes metas de ahorro</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        Crea tu primera meta para empezar a separar dinero.
                    </p>
                    <SavingsGoalForm wallets={wallets} />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {goals.map((goal) => (
                        <SavingsCard key={goal.id} goal={goal} wallets={wallets} />
                    ))}
                </div>
            )}
        </div>
    );
}
