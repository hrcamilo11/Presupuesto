
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TAX_PERIOD_LABELS } from "@/lib/database.types";

export default async function TaxesDebugPage() {
    const supabase = await createClient();

    const { data: taxes } = await supabase
        .from("tax_obligations")
        .select(`*`)
        .order("due_date", { ascending: true });

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Taxes Debug</h1>

            <div className="grid gap-6">
                {taxes?.map((tax) => (
                    <Card key={tax.id}>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>{tax.name}</span>
                                <span className="text-muted-foreground text-sm font-mono">{tax.id}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div className="p-2 border rounded bg-muted/30">
                                    <p className="text-muted-foreground">Amount</p>
                                    <p className="font-bold">{formatCurrency(tax.amount, tax.currency)}</p>
                                </div>
                                <div className="p-2 border rounded bg-muted/30">
                                    <p className="text-muted-foreground">Period</p>
                                    <p className="font-bold">{(TAX_PERIOD_LABELS as Record<string, string>)[tax.period_type] || tax.period_type}</p>
                                </div>
                                <div className="p-2 border rounded bg-muted/30">
                                    <p className="text-muted-foreground">Due Date</p>
                                    <p className="font-bold">{tax.due_date}</p>
                                </div>
                                <div className="p-2 border rounded bg-muted/30">
                                    <p className="text-muted-foreground">Status</p>
                                    <p className={tax.paid_at ? "text-green-600 font-bold" : "text-amber-600 font-bold"}>
                                        {tax.paid_at ? `Paid on ${tax.paid_at}` : "Pending"}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-muted/20 border rounded text-xs font-mono overflow-auto max-h-40">
                                <h4 className="font-bold mb-2">Raw JSON</h4>
                                <pre>{JSON.stringify(tax, null, 2)}</pre>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
