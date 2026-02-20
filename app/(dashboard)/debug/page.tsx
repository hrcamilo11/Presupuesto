
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ArrowRightLeft, PiggyBank, Users, TrendingUp } from "lucide-react";

export default function DebugDashboard() {
    const modules = [
        { name: "Wallets", href: "/debug/wallets", icon: Wallet, desc: "Billeteras y saldos" },
        { name: "Movements", href: "/debug/movements", icon: ArrowRightLeft, desc: "Ingresos y gastos" },
        { name: "Budgets", href: "/debug/budgets", icon: PiggyBank, desc: "Presupuestos y límites" },
        { name: "Social (Debts/Col.)", href: "/debug/collections", icon: Users, desc: "Deudas, cobros y amigos" },
        { name: "Savings & Invest.", href: "/debug/savings", icon: TrendingUp, desc: "Metas e inversiones" },
        { name: "Loans", href: "/debug/loans", icon: ArrowRightLeft, desc: "Préstamos y amortización" },
        { name: "Subscriptions", href: "/debug/subscriptions", icon: ArrowRightLeft, desc: "Suscripciones recurrentes" },
        { name: "Taxes", href: "/debug/taxes", icon: ArrowRightLeft, desc: "Obligaciones tributarias" },
        { name: "Shared (Diag.)", href: "/debug-shared", icon: Users, desc: "Diagnóstico compartido" },
        { name: "Friends (Diag.)", href: "/debug-friends", icon: Users, desc: "Diagnóstico de amigos" },
    ];

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">System Validation Dashboard</h1>
            <p className="text-muted-foreground">
                Centralized hub for inspecting raw data and validating module logic.
                Only available in development.
            </p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {modules.map((mod) => (
                    <Link key={mod.name} href={mod.href}>
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {mod.name}
                                </CardTitle>
                                <mod.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{mod.desc}</div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
