"use client";

import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SharedSavingsGoal } from "@/lib/database.types";

interface SharedSavingsCardProps {
  goal: SharedSavingsGoal;
}

export function SharedSavingsCard({ goal }: SharedSavingsCardProps) {
  const percentage = useMemo(() => {
    if (goal.target_amount <= 0) return 0;
    return Math.min(100, (goal.current_amount / goal.target_amount) * 100);
  }, [goal.current_amount, goal.target_amount]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm font-semibold">
          <span className="truncate">{goal.name}</span>
          <span className="text-xs uppercase text-muted-foreground">
            {percentage.toFixed(0)}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-bold">
            {formatCurrency(goal.current_amount)}
          </span>
          <span className="text-xs text-muted-foreground">
            de {formatCurrency(goal.target_amount)}
          </span>
        </div>
        {goal.deadline && (
          <p className="text-xs text-muted-foreground">
            Fecha objetivo: {new Date(goal.deadline).toLocaleDateString()}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Estado:{" "}
          {goal.status === "completed"
            ? "Completada"
            : goal.status === "cancelled"
            ? "Cancelada"
            : "Activa"}
        </p>
      </CardContent>
    </Card>
  );
}

