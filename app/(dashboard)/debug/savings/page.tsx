
import { createClient } from "@/lib/supabase/server";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

export default async function DebugSavingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Not authenticated</div>;

    const { data: goals, error: goalsError } = await supabase
        .from("savings_goals")
        .select("*");

    const { data: investments, error: investError } = await supabase
        .from("investments")
        .select("*");

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold">Debug: Savings & Investments</h1>

            <section>
                <h2 className="text-xl font-semibold mb-4">Savings Goals</h2>
                {goalsError && <div className="text-red-500">{goalsError.message}</div>}
                <div className="bg-muted p-4 rounded-lg overflow-auto max-h-60">
                    <pre className="text-xs">{JSON.stringify(goals, null, 2)}</pre>
                </div>
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Investments</h2>
                {investError && <div className="text-red-500">{investError.message}</div>}
                <div className="bg-muted p-4 rounded-lg overflow-auto max-h-60">
                    <pre className="text-xs">{JSON.stringify(investments, null, 2)}</pre>
                </div>
            </section>
        </div>
    );
}
