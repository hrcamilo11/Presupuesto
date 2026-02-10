"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar } from "lucide-react";
import type { SharedSavingsGoal } from "@/lib/database.types";
import { formatCurrency } from "@/lib/utils";

type Props = {
    goal: SharedSavingsGoal;
};

export function SharedSavingsGoalCard({ goal }: Props) {
    const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
    const remaining = Math.max(goal.target_amount - goal.current_amount, 0);

    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4" style={{ borderLeftColor: progress >= 100 ? '#22c55e' : '#3b82f6' }}>
            <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-bold">{goal.name}</CardTitle>
                    </div>
                    <Badge variant={goal.status === 'completed' ? 'success' : 'outline'} className="text-[10px] h-5">
                        {goal.status === 'completed' ? 'Meta Lograda' : 'En Progreso'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-2xl font-black">{formatCurrency(goal.current_amount)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            Objetivo: {formatCurrency(goal.target_amount)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-primary">{Math.round(progress)}%</p>
                    </div>
                </div>

                <Progress value={progress} className="h-2" />

                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'Sin fecha límite'}
                    </div>
                    {remaining > 0 && (
                        <span>Faltan {formatCurrency(remaining)}</span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
