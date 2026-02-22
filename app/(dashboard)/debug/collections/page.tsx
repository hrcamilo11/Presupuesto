
import { createClient } from "@/lib/supabase/server";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

export default async function DebugCollectionsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Not authenticated</div>;

    const { data: collections, error } = await supabase
        .from("collections")
        .select(`
      *,
      creditor:profiles!collections_creditor_id_fkey(username, full_name),
      debtor:profiles!collections_debtor_id_fkey(username, full_name)
    `)
        .or(`creditor_id.eq.${user.id},debtor_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold">Debug: Collections (Deudas/Cobros)</h1>
            {error && <div className="text-red-500">{error.message}</div>}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Other Party</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {collections?.map((col) => {
                            const isCreditor = col.creditor_id === user.id;
                            const otherParty = isCreditor ? col.debtor : col.creditor;
                            const type = isCreditor ? "Cobro (Incoming)" : "Deuda (Outgoing)";

                            return (
                                <TableRow key={col.id}>
                                    <TableCell className={isCreditor ? "text-green-600" : "text-red-600"}>{type}</TableCell>
                                    <TableCell>@{otherParty?.username} ({otherParty?.full_name})</TableCell>
                                    <TableCell>{col.description}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: col.currency }).format(col.amount)}
                                    </TableCell>
                                    <TableCell>{col.status}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <div className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
                <h3 className="font-semibold mb-2">Raw Data</h3>
                <pre className="text-xs">{JSON.stringify(collections, null, 2)}</pre>
            </div>
        </div>
    );
}
