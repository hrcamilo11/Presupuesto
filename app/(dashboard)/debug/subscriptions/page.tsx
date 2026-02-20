
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { SUBSCRIPTION_FREQUENCY_LABELS } from "@/lib/database.types";

export default async function SubscriptionsDebugPage() {
    const supabase = await createClient();

    const { data: subs } = await supabase
        .from("subscriptions")
        .select(`*`)
        .order("next_due_date", { ascending: true });

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Subscriptions Debug</h1>

            <div className="grid gap-6">
                {subs?.map((sub) => (
                    <Card key={sub.id}>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>{sub.name}</span>
                                <span className="text-muted-foreground text-sm font-mono">{sub.id}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div className="p-2 border rounded bg-muted/30">
                                    <p className="text-muted-foreground">Amount</p>
                                    <p className="font-bold">{formatCurrency(sub.amount, sub.currency)}</p>
                                </div>
                                <div className="p-2 border rounded bg-muted/30">
                                    <p className="text-muted-foreground">Frequency</p>
                                    <p className="font-bold">{(SUBSCRIPTION_FREQUENCY_LABELS as any)[sub.frequency] || sub.frequency}</p>
                                </div>
                                <div className="p-2 border rounded bg-muted/30">
                                    <p className="text-muted-foreground">Next Due Date</p>
                                    <p className="font-bold">{sub.next_due_date}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-muted/20 border rounded text-xs font-mono overflow-auto max-h-40">
                                <h4 className="font-bold mb-2">Raw JSON</h4>
                                <pre>{JSON.stringify(sub, null, 2)}</pre>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
