"use client";

import { useEffect, useState } from "react";
import { RadialBarChart, RadialBar } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type Props = {
  balance: number;
  totalIncome: number;
  totalExpense: number;
};

const balanceRadialConfig = {
  ingresos: { label: "Ingresos", color: "#22c55e" },
  gastos: { label: "Gastos", color: "#ef4444" },
} satisfies ChartConfig;

const formatCop = (value: number | undefined) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value ?? 0);

export function BalanceRing({ balance, totalIncome, totalExpense }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const total = totalIncome + totalExpense || 1;
  const incomeShare = total > 0 ? Math.round((totalIncome / total) * 100) : 50;
  const expenseShare = total > 0 ? Math.round((totalExpense / total) * 100) : 50;

  const radialData = [
    { name: "ingresos", value: incomeShare, fill: "var(--color-ingresos)" },
    { name: "gastos", value: expenseShare, fill: "var(--color-gastos)" },
  ];

  if (!mounted) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <div className="h-[140px] w-[140px] animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 max-w-full flex-col items-center gap-3">
      <ChartContainer
        config={balanceRadialConfig}
        className="mx-auto h-[180px] w-full max-w-[200px] min-w-0"
      >
        <RadialBarChart
          innerRadius="60%"
          outerRadius="100%"
          data={radialData}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={6}
            background
            max={100}
            stackId="1"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => [`${value}% del total`, ""]}
                hideLabel
              />
            }
          />
        </RadialBarChart>
      </ChartContainer>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-2xl font-bold tabular-nums">
          {formatCop(balance)}
        </span>
        <span className="text-xs text-muted-foreground">
          {balance >= 0 ? "Superávit" : "Déficit"}
        </span>
      </div>
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" /> Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Gastos
        </span>
      </div>
    </div>
  );
}
