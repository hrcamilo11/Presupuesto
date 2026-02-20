
import { createClient } from "@/lib/supabase/server";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

export default async function DebugMovementsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Not authenticated</div>;

    const [incomesRes, expensesRes] = await Promise.all([
        supabase
            .from("incomes")
            .select(`*, wallet:wallets(name), category:categories(name)`)
            .order("date", { ascending: false })
            .limit(25),
        supabase
            .from("expenses")
            .select(`*, wallet:wallets(name), category:categories(name)`)
            .order("date", { ascending: false })
            .limit(25)
    ]);

    const error = incomesRes.error || expensesRes.error;

    const incomes = (incomesRes.data || []).map(i => ({ ...i, type: 'income' }));
    const expenses = (expensesRes.data || []).map(e => ({ ...e, type: 'expense' }));
    const movements = [...incomes, ...expenses].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold">Debug: Recent Movements (Last 50)</h1>
            {error && <div className="text-red-500">{error.message}</div>}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Wallet</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Type</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {movements?.map((mov: any) => (
                            <TableRow key={`${mov.type}-${mov.id}`}>
                                <TableCell>{new Date(mov.date).toLocaleDateString()}</TableCell>
                                <TableCell>{mov.description}</TableCell>
                                <TableCell>{mov.wallet?.name}</TableCell>
                                <TableCell>{mov.category?.name}</TableCell>
                                <TableCell className={`text-right font-mono ${mov.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'COP' }).format(mov.amount)}
                                </TableCell>
                                <TableCell>{mov.type}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
                <h3 className="font-semibold mb-2">Raw Data</h3>
                <pre className="text-xs">{JSON.stringify(movements, null, 2)}</pre>
            </div>
        </div>
    );
}
