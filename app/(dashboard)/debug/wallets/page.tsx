
import { createClient } from "@/lib/supabase/server";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

export default async function DebugWalletsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Not authenticated</div>;

    const { data: wallets, error } = await supabase
        .from("wallets")
        .select("*")
        .order("display_order", { ascending: true });

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold">Debug: Wallets</h1>
            {error && <div className="text-red-500">{error.message}</div>}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead className="text-right">Order</TableHead>
                            <TableHead>Currency</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {wallets?.map((wallet) => (
                            <TableRow key={wallet.id}>
                                <TableCell className="font-mono text-xs">{wallet.id}</TableCell>
                                <TableCell>{wallet.name}</TableCell>
                                <TableCell>{wallet.type}</TableCell>
                                <TableCell className="text-right font-mono">
                                    {new Intl.NumberFormat(undefined, { style: 'currency', currency: wallet.currency }).format(wallet.balance)}
                                </TableCell>
                                <TableCell className="text-right">{wallet.display_order}</TableCell>
                                <TableCell>{wallet.currency}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
                <h3 className="font-semibold mb-2">Raw Data</h3>
                <pre className="text-xs">{JSON.stringify(wallets, null, 2)}</pre>
            </div>
        </div>
    );
}
