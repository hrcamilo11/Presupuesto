"use client";

import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { EXPENSE_PRIORITY_LABELS, type ExpensePriority } from "@/lib/database.types";
import { TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = ["#ef4444", "#f97316", "#a855f7"];

type Props = {
  data: Record<ExpensePriority, number>;
};

export function ExpensePieChart({ data }: Props) {
  const entries = (Object.entries(data) as [ExpensePriority, number][]).filter(([, v]) => v > 0);
  const chartData = entries.map(([name, value]) => ({
    name: EXPENSE_PRIORITY_LABELS[name],
    value: Math.round(value * 100) / 100,
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

  const chartHeight = 240;
  return (
    <div className="w-full" style={{ minWidth: 1, minHeight: chartHeight }}>
      <ResponsiveContainer width="100%" height={chartHeight} minHeight={chartHeight} minWidth={1}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value), ""]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatCurrency(n: number): string {
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
