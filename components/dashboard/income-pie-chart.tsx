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
import { INCOME_TYPE_LABELS, type IncomeType } from "@/lib/database.types";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

import { formatCurrency } from "@/lib/utils";

const COLORS = ["#22c55e", "#84cc16", "#eab308"];

const incomeChartConfig: ChartConfig = {
  [INCOME_TYPE_LABELS.monthly]: { label: INCOME_TYPE_LABELS.monthly, color: COLORS[0] },
  [INCOME_TYPE_LABELS.irregular]: { label: INCOME_TYPE_LABELS.irregular, color: COLORS[1] },
  [INCOME_TYPE_LABELS.occasional]: { label: INCOME_TYPE_LABELS.occasional, color: COLORS[2] },
};

const formatCop = (value: number | undefined) => formatCurrency(value ?? 0);

type Props = {
  data: Record<IncomeType, number>;
};

export function IncomePieChart({ data }: Props) {
  const entries = (Object.entries(data) as [IncomeType, number][]).filter(([, v]) => v > 0);
  const chartData = entries.map(([name, value]) => ({
    name: INCOME_TYPE_LABELS[name],
    value: Math.round(value * 100) / 100,
    fill: COLORS[entries.findIndex(([k]) => k === name) % COLORS.length],
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 px-4">
        <TrendingUp className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-center text-sm font-medium text-muted-foreground">
          Sin ingresos este mes
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/incomes">Agregar ingreso</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full overflow-hidden">
      <ChartContainer config={incomeChartConfig} className="min-h-[240px] w-full max-w-full">
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
    </div>
  );
}
