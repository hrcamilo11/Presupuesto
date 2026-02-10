import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSharedAccountStats, getSharedSavingsGoals } from "@/app/actions/shared-features";
import { SharedSavingsGoalCard } from "@/components/shared/shared-savings-card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, Users, Goal } from "lucide-react";

export default async function SharedAccountDashboardPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { id } = params;

    // Fetch account details
    const { data: account, error: accError } = await supabase
        .from("shared_accounts")
        .select(`
            *,
            members:shared_account_members(
                *,
                profiles(*)
            )
        `)
        .eq("id", id)
        .single();

    if (accError || !account) {
        notFound();
    }

    const [statsRes, goalsRes] = await Promise.all([
        getSharedAccountStats(id),
        getSharedSavingsGoals(id)
    ]);

    const stats = statsRes.data || { totalIncome: 0, totalExpense: 0, balance: 0 };
    const goals = goalsRes.data || [];
    const totalGroupSavings = goals.reduce(
        (sum: number, g: { current_amount?: number }) => sum + Number(g.current_amount ?? 0),
        0
    );

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl">{account.name}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            {account.members.length} {account.members.length === 1 ? 'miembro' : 'miembros'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-primary text-primary-foreground shadow-2xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest">Balance Total</CardTitle>
                        <Wallet className="w-4 h-4 opacity-70" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{formatCurrency(stats.balance)}</div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Ingresos Totales</CardTitle>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{formatCurrency(stats.totalIncome)}</div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all border-l-4 border-l-rose-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Gastos Totales</CardTitle>
                        <TrendingDown className="w-4 h-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{formatCurrency(stats.totalExpense)}</div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all border-l-4 border-l-sky-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                            Ahorro total
                        </CardTitle>
                        <Goal className="w-4 h-4 text-sky-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{formatCurrency(totalGroupSavings)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Goal className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-bold">Metas de Ahorro Grupal</h2>
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {goals.map(goal => (
                            <SharedSavingsGoalCard key={goal.id} goal={goal} />
                        ))}
                        {goals.length === 0 && (
                            <Card className="col-span-full border-dashed border-2 flex flex-col items-center justify-center p-8 text-center bg-muted/20">
                                <p className="text-muted-foreground text-sm">No hay metas activas.</p>
                            </Card>
                        )}
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-bold">Miembros del Equipo</h2>
                    </div>
                    <Card>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {account.members.map((m: { id: string; profiles: { full_name: string | null }; role: string }) => (
                                    <div key={m.id} className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {m.profiles?.full_name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{m.profiles?.full_name || 'Incógnito'}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">{m.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    );
}
