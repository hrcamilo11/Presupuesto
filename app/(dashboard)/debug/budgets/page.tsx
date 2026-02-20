
import { createClient } from "@/lib/supabase/server";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export default async function DebugBudgetsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Not authenticated</div>;

    const { data: budgets, error } = await supabase
        .from("budgets")
        .select(`
      *,
      category:categories(name)
    `)
        .eq("user_id", user.id);

    // We could also run a raw query here to verify the 'spent' calculation logic if needed
    // For now, let's just see what the budget table holds.

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold">Debug: Budgets</h1>
            {error && <div className="text-red-500">{error.message}</div>}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Limit</TableHead>
                            <TableHead className="text-right">Spent (Calculated in UI)</TableHead>
                            <TableHead>Period</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {budgets?.map((b: any) => (
                            <TableRow key={b.id}>
                                <TableCell>{b.category?.name}</TableCell>
                                <TableCell className="text-right font-mono">
                                    {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'COP' }).format(b.amount)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                    (Check UI)
                                </TableCell>
                                <TableCell>{b.period}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
                <h3 className="font-semibold mb-2">Raw Data</h3>
                <pre className="text-xs">{JSON.stringify(budgets, null, 2)}</pre>
            </div>
        </div>
    );
}
