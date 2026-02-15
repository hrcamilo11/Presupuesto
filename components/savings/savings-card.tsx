"use client";

import { useMemo } from "react";
import { formatCurrency, formatDateYMD } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import type { SavingsGoal, Wallet } from "@/lib/database.types";
import { deleteSavingsGoal } from "@/app/actions/savings";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { ContributionForm } from "./contribution-form";
import { WithdrawForm } from "./withdraw-form";

// SavingsGoalProps is compatible with SavingsGoal from DB but cleaner for UI if needed
// For now, we can just use the DB type or a subset


interface SavingsCardProps {
    goal: SavingsGoal;
    wallets: Wallet[];
}

export function SavingsCard({ goal, wallets }: SavingsCardProps) {
    const { toast } = useToast();
    const router = useRouter();

    const percentage = useMemo(() => {
        if (goal.target_amount <= 0) return 0;
        return Math.min(100, (goal.current_amount / goal.target_amount) * 100);
    }, [goal.current_amount, goal.target_amount]);

    async function handleDelete() {
        if (!confirm("¿Estás seguro de eliminar esta meta? El dinero ahorrado (historial) podría perderse visualmente si no se reintegra a una cuenta.")) return;

        const res = await deleteSavingsGoal(goal.id);
        if (res.error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: res.error,
            });
        } else {
            toast({
                title: "Eliminada",
                description: "La meta ha sido eliminada.",
            });
            router.refresh();
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="font-semibold">{goal.name}</CardTitle>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                            <Trash className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
                <div className="mt-2 space-y-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold">
                                {formatCurrency(goal.current_amount)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                de {formatCurrency(goal.target_amount)}
                            </span>
                        </div>
                        {goal.target_date && (
                            <div className="text-xs text-muted-foreground text-right">
                                Meta: {formatDateYMD(goal.target_date as unknown as string)}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
                <ContributionForm goalId={goal.id} wallets={wallets} />
                <WithdrawForm
                    goalId={goal.id}
                    goalName={goal.name}
                    currentAmount={Number(goal.current_amount ?? 0)}
                    wallets={wallets}
                />
            </CardFooter>
        </Card>
    );
}
