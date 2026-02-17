import { getAllMovementsHistory } from "@/app/actions/wallets";
import { MovementsClient } from "./movements-client";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MovementsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: movements, error } = await getAllMovementsHistory({ limit: 500 });

    if (error) {
        return <div className="p-4 text-destructive">Error: {error}</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Movimientos</h1>
                <p className="text-muted-foreground">
                    Historial general de todos tus ingresos, gastos, transferencias e inversiones.
                </p>
            </div>
            <MovementsClient initialMovements={movements || []} />
        </div>
    );
}
