"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatNumber } from "@/lib/utils";

type CategorySlice = {
  name: string;
  income: number;
  expense: number;
};

type TagSlice = {
  name: string;
  income: number;
  expense: number;
};

type AccountSlice = {
  name: string;
  income: number;
  expense: number;
};

interface DistributionSectionProps {
  categories: CategorySlice[];
  tags: TagSlice[];
  accounts: AccountSlice[];
}

const CATEGORY_COLORS = ["#0ea5e9", "#8b5cf6", "#f97316", "#22c55e", "#e11d48", "#6366f1"];
const TAG_COLORS = ["#22c55e", "#f97316", "#a855f7", "#eab308", "#06b6d4", "#f43f5e"];
const ACCOUNT_COLORS = ["#0f766e", "#2563eb", "#f97316", "#a855f7", "#22c55e", "#dc2626"];

const chartHeight = 220;

const distributionChartConfig = {
  value: { label: "Monto", color: "hsl(var(--muted-foreground))" },
} satisfies ChartConfig;

function DistributionBarChart({
  data,
  colors,
  title,
  emptyMessage,
}: {
  data: { name: string; value: number }[];
  colors: string[];
  title: string;
  emptyMessage: string;
}) {
  if (data.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const dataWithFill = data.map((d, i) => ({
    ...d,
    fill: colors[i % colors.length],
  }));
  const marginLeft = Math.min(120, Math.max(60, ...data.map((d) => d.name.length * 7)));

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </p>
      <ChartContainer
        config={distributionChartConfig}
        className="w-full"
        style={{ minHeight: chartHeight, height: chartHeight }}
      >
        <BarChart
          layout="vertical"
          data={dataWithFill}
          margin={{ top: 4, right: 24, left: marginLeft, bottom: 4 }}
          accessibilityLayer
        >
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) =>
              v >= 1000000
                ? `$${(v / 1000000).toFixed(1)}M`
                : v >= 1000
                  ? `$${(v / 1000).toFixed(0)}k`
                  : `$${v}`
            }
          />
          <YAxis
            type="category"
            dataKey="name"
            width={marginLeft - 8}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => [`$${formatNumber(Number(value ?? 0))}`, ""]}
                labelFormatter={(label) => label}
              />
            }
          />
          <Bar dataKey="value" name="Monto" radius={[0, 4, 4, 0]} minPointSize={8}>
            {dataWithFill.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

export function DistributionSection({ categories, tags, accounts }: DistributionSectionProps) {
  const incomeByCategory = categories
    .filter((c) => c.income > 0)
    .map((c) => ({ name: c.name, value: Math.round(c.income) }));
  const expenseByCategory = categories
    .filter((c) => c.expense > 0)
    .map((c) => ({ name: c.name, value: Math.round(c.expense) }));

  const incomeByTag = tags
    .filter((t) => t.income > 0)
    .map((t) => ({ name: t.name, value: Math.round(t.income) }));
  const expenseByTag = tags
    .filter((t) => t.expense > 0)
    .map((t) => ({ name: t.name, value: Math.round(t.expense) }));

  const incomeByAccount = accounts
    .filter((a) => a.income > 0)
    .map((a) => ({ name: a.name, value: Math.round(a.income) }));
  const expenseByAccount = accounts
    .filter((a) => a.expense > 0)
    .map((a) => ({ name: a.name, value: Math.round(a.expense) }));

  const hasAnyData =
    incomeByCategory.length ||
    expenseByCategory.length ||
    incomeByTag.length ||
    expenseByTag.length ||
    incomeByAccount.length ||
    expenseByAccount.length;

  return (
    <Card className="card-hover shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 sm:p-6 pb-2">
        <div>
          <CardTitle className="text-base sm:text-lg">
            Distribución por categoría, etiqueta y cuenta
          </CardTitle>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Cómo se reparten tus ingresos y gastos este mes.
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-4 sm:p-6 sm:pt-2">
        {!hasAnyData ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aún no hay movimientos este mes para mostrar una distribución.
          </p>
        ) : (
          <Tabs defaultValue="category" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 rounded-full bg-muted">
              <TabsTrigger value="category">Por categoría</TabsTrigger>
              <TabsTrigger value="tag">Por etiqueta</TabsTrigger>
              <TabsTrigger value="account">Por cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="category" className="mt-2 space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <DistributionBarChart
                  data={incomeByCategory}
                  colors={CATEGORY_COLORS}
                  title="Ingresos por categoría"
                  emptyMessage="No hay ingresos categorizados este mes."
                />
                <DistributionBarChart
                  data={expenseByCategory}
                  colors={CATEGORY_COLORS}
                  title="Gastos por categoría"
                  emptyMessage="No hay gastos categorizados este mes."
                />
              </div>
            </TabsContent>

            <TabsContent value="tag" className="mt-2 space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <DistributionBarChart
                  data={incomeByTag}
                  colors={TAG_COLORS}
                  title="Ingresos por etiqueta"
                  emptyMessage="No hay etiquetas asociadas a ingresos este mes."
                />
                <DistributionBarChart
                  data={expenseByTag}
                  colors={TAG_COLORS}
                  title="Gastos por etiqueta"
                  emptyMessage="No hay etiquetas asociadas a gastos este mes."
                />
              </div>
            </TabsContent>

            <TabsContent value="account" className="mt-2 space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <DistributionBarChart
                  data={incomeByAccount}
                  colors={ACCOUNT_COLORS}
                  title="Ingresos por cuenta"
                  emptyMessage="No hay ingresos registrados por cuenta este mes."
                />
                <DistributionBarChart
                  data={expenseByAccount}
                  colors={ACCOUNT_COLORS}
                  title="Gastos por cuenta"
                  emptyMessage="No hay gastos registrados por cuenta este mes."
                />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
