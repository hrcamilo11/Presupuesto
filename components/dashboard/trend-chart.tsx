"use client";

import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart3 } from "lucide-react";
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
        <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
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
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        accessibilityLayer
      >
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
        <Bar
          dataKey="ingresos"
          fill="var(--color-ingresos)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="gastos"
          fill="var(--color-gastos)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
