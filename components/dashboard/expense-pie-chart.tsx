"use client";

import Link from "next/link";
import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { EXPENSE_PRIORITY_LABELS, type ExpensePriority } from "@/lib/database.types";
import { TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = ["#ef4444", "#f97316", "#a855f7"];

const expenseChartConfig: ChartConfig = {
  [EXPENSE_PRIORITY_LABELS.obligatory]: {
    label: EXPENSE_PRIORITY_LABELS.obligatory,
    color: COLORS[0],
  },
  [EXPENSE_PRIORITY_LABELS.necessary]: {
    label: EXPENSE_PRIORITY_LABELS.necessary,
    color: COLORS[1],
  },
  [EXPENSE_PRIORITY_LABELS.optional]: {
    label: EXPENSE_PRIORITY_LABELS.optional,
    color: COLORS[2],
  },
};

const formatCop = (value: number | undefined) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value ?? 0);

type Props = {
  data: Record<ExpensePriority, number>;
};

export function ExpensePieChart({ data }: Props) {
  const entries = (Object.entries(data) as [ExpensePriority, number][]).filter(([, v]) => v > 0);
  const chartData = entries.map(([name, value]) => ({
    name: EXPENSE_PRIORITY_LABELS[name],
    value: Math.round(value * 100) / 100,
    fill: COLORS[entries.findIndex(([k]) => k === name) % COLORS.length],
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 px-4">
        <TrendingDown className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-center text-sm font-medium text-muted-foreground">
          Sin gastos este mes
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/expenses">Agregar gasto</Link>
        </Button>
      </div>
    );
  }

  return (
    <ChartContainer config={expenseChartConfig} className="min-h-[240px] w-full">
      <PieChart accessibilityLayer>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, i) => (
            <Cell key={entry.name} fill={entry.fill ?? COLORS[i % COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <ChartTooltip
          content={
            <ChartTooltipContent
              nameKey="name"
              formatter={(value) => [formatCop(Number(value)), ""]}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}
