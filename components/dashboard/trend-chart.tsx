"use client";

import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
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
    <div className="h-[220px] w-full sm:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
        <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" tickFormatter={(v) => `$${v >= 1000 ? (v / 1000) + "k" : v}`} />
        <Tooltip
          formatter={(value: number) => [`$${value.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, ""]}
          labelFormatter={(label) => `Mes: ${label}`}
          contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
        />
        <Legend />
        <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
