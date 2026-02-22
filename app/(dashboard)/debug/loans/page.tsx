
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { type LoanPayment } from "@/lib/database.types";

export default async function LoansDebugPage() {
    const supabase = await createClient();

    const { data: loans } = await supabase
        .from("loans")
        .select(`
            *,
            loan_payments (*)
        `)
        .order("created_at", { ascending: false });

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Loans Debug</h1>

            <div className="grid gap-6">
                {loans?.map((loan) => (
                    <Card key={loan.id}>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>{loan.name}</span>
                                <span className="text-muted-foreground text-sm font-mono">{loan.id}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div className="p-2 border rounded bg-muted/30">
                                    <p className="text-muted-foreground">Principal</p>
                                    <p className="font-bold">{formatCurrency(loan.principal, loan.currency)}</p>
                                </div>
                                <div className="p-2 border rounded bg-muted/30">
                                    <p className="text-muted-foreground">Rate (Annual)</p>
                                    <p className="font-bold">{loan.annual_interest_rate}%</p>
                                </div>
                                <div className="p-2 border rounded bg-muted/30">
                                    <p className="text-muted-foreground">Term</p>
                                    <p className="font-bold">{loan.term_months} months</p>
                                </div>
                                <div className="p-2 border rounded bg-muted/30">
                                    <p className="text-muted-foreground">Start Date</p>
                                    <p className="font-bold">{loan.start_date}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-semibold">Payments ({loan.loan_payments?.length || 0})</h3>
                                <div className="border rounded overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="p-2 text-left">#</th>
                                                <th className="p-2 text-left">Date</th>
                                                <th className="p-2 text-right">Amount</th>
                                                <th className="p-2 text-right">Principal</th>
                                                <th className="p-2 text-right">Interest</th>
                                                <th className="p-2 text-right">Balance After</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loan.loan_payments?.sort((a: LoanPayment, b: LoanPayment) => a.payment_number - b.payment_number).map((p: LoanPayment) => (
                                                <tr key={p.id} className="border-t">
                                                    <td className="p-2">{p.payment_number}</td>
                                                    <td className="p-2">{p.paid_at}</td>
                                                    <td className="p-2 text-right">{formatCurrency(p.amount, loan.currency)}</td>
                                                    <td className="p-2 text-right">{formatCurrency(p.principal_portion, loan.currency)}</td>
                                                    <td className="p-2 text-right">{formatCurrency(p.interest_portion, loan.currency)}</td>
                                                    <td className="p-2 text-right font-bold">{formatCurrency(p.balance_after, loan.currency)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="p-4 bg-muted/20 border rounded text-xs font-mono overflow-auto max-h-40">
                                <h4 className="font-bold mb-2">Raw JSON</h4>
                                <pre>{JSON.stringify(loan, null, 2)}</pre>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
