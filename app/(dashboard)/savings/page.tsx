import { getSavingsGoals, getSharedSavingsGoals } from "@/app/actions/savings";
import { getWallets } from "@/app/actions/wallets";
import { SavingsGoalForm } from "@/components/savings/savings-form";
import { SavingsCard } from "@/components/savings/savings-card";
import { SharedSavingsForm } from "@/components/savings/shared-savings-form";
import { SharedSavingsCard } from "@/components/savings/shared-savings-card";
import { getMySharedAccounts } from "@/app/actions/shared-accounts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default async function SavingsPage() {
    const [{ data: goals, error }, { data: wallets }, { data: sharedAccounts }, { data: sharedGoals }] =
        await Promise.all([
            getSavingsGoals(),
            getWallets(),
            getMySharedAccounts(),
            getSharedSavingsGoals(),
        ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Metas de Ahorro</h1>
                    <p className="text-muted-foreground">
                        Define objetivos personales o grupales para alcanzar tus metas.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="personal" className="space-y-4">
                <TabsList className="w-full justify-start overflow-x-auto rounded-xl">
                    <TabsTrigger value="personal">Personales</TabsTrigger>
                    <TabsTrigger value="shared">Grupales</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Metas personales</h2>
                        <SavingsGoalForm wallets={wallets} />
                    </div>
                    {error ? (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                            Error al cargar metas: {error}
                        </div>
                    ) : goals.length === 0 ? (
                        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
                            <h3 className="mt-2 text-lg font-semibold">No tienes metas personales</h3>
                            <p className="mb-4 mt-1 text-sm text-muted-foreground">
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
                </TabsContent>

                <TabsContent value="shared" className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-lg font-semibold">Metas grupales</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            {sharedAccounts.length > 0 ? (
                                <>
                                    <span className="text-xs text-muted-foreground">
                                        Grupos: {sharedAccounts.length}
                                    </span>
                                    <SharedSavingsForm sharedAccounts={sharedAccounts} />
                                </>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Crea o únete a un grupo en &quot;Cuentas compartidas&quot; para empezar.
                                </p>
                            )}
                        </div>
                    </div>

                    {sharedAccounts.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                            Aún no perteneces a ningún grupo compartido. Crea uno o acepta una invitación para ver
                            metas de ahorro grupales aquí.
                        </div>
                    ) : sharedGoals.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                            No hay metas compartidas todavía. Crea una meta vinculada a uno de tus grupos.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {sharedGoals.map((goal) => (
                                <SharedSavingsCard key={goal.id} goal={goal} wallets={wallets} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
