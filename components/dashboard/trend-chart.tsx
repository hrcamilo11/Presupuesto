"use client";

import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type MonthData = {
  month: string;
  ingresos: number;
  gastos: number;
  balance: number;
};

type Props = {
  data: MonthData[];
};

const trendChartConfig = {
  month: { label: "Mes" },
  ingresos: { label: "Ingresos", color: "#22c55e" },
  gastos: { label: "Gastos", color: "#ef4444" },
} satisfies ChartConfig;

const formatCop = (value: number | undefined) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value ?? 0);

export function TrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 px-4 sm:h-[280px]">
        <TrendingUp className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-center text-sm font-medium text-muted-foreground">
          Sin datos de tendencia
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Registra ingresos y gastos para ver la evolución por mes.
        </p>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/incomes">Agregar ingreso</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/expenses">Agregar gasto</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer config={trendChartConfig} className="min-h-[280px] w-full">
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        accessibilityLayer
      >
        <defs>
          <linearGradient id="fillIngresos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-ingresos)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--color-ingresos)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillGastos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-gastos)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--color-gastos)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) =>
            Number.isFinite(v) ? `$${v >= 1000 ? (v / 1000) + "k" : v}` : ""
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => [formatCop(Number(value)), ""]}
              labelFormatter={(label) => `Mes: ${label}`}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          type="monotone"
          dataKey="ingresos"
          stroke="var(--color-ingresos)"
          fill="url(#fillIngresos)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="gastos"
          stroke="var(--color-gastos)"
          fill="url(#fillGastos)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
