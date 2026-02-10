"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
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

type AllocationInfo = {
  label: string;
  amount: number;
};

interface DistributionSectionProps {
  categories: CategorySlice[];
  tags: TagSlice[];
  allocations: AllocationInfo[];
}

const CATEGORY_COLORS = ["#0ea5e9", "#8b5cf6", "#f97316", "#22c55e", "#e11d48", "#6366f1"];
const TAG_COLORS = ["#22c55e", "#f97316", "#a855f7", "#eab308", "#06b6d4", "#f43f5e"];

export function DistributionSection({ categories, tags, allocations }: DistributionSectionProps) {
  const incomeByCategory = categories.filter((c) => c.income > 0).map((c) => ({
    name: c.name,
    value: Math.round(c.income),
  }));
  const expenseByCategory = categories.filter((c) => c.expense > 0).map((c) => ({
    name: c.name,
    value: Math.round(c.expense),
  }));

  const incomeByTag = tags.filter((t) => t.income > 0).map((t) => ({
    name: t.name,
    value: Math.round(t.income),
  }));
  const expenseByTag = tags.filter((t) => t.expense > 0).map((t) => ({
    name: t.name,
    value: Math.round(t.expense),
  }));

  const hasAnyData =
    incomeByCategory.length ||
    expenseByCategory.length ||
    incomeByTag.length ||
    expenseByTag.length;

  const chartHeight = 220;

  return (
    <Card className="card-hover shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 sm:p-6 pb-2">
        <div>
          <CardTitle className="text-base sm:text-lg">
            Distribución por categoría y etiqueta
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="category">Por categoría</TabsTrigger>
              <TabsTrigger value="tag">Por etiqueta</TabsTrigger>
            </TabsList>

            <TabsContent value="category" className="mt-2 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Ingresos por categoría
                  </p>
                  {incomeByCategory.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No hay ingresos categorizados este mes.
                    </p>
                  ) : (
                    <div style={{ minWidth: 1, minHeight: chartHeight }}>
                      <ResponsiveContainer width="100%" height={chartHeight}>
                        <PieChart>
                          <Pie
                            data={incomeByCategory}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            paddingAngle={2}
                            label={({ name, percent }) =>
                              `${name} ${(percent ?? 0 * 100).toFixed(0)}%`
                            }
                          >
                            {incomeByCategory.map((_, i) => (
                              <Cell
                                key={i}
                                fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                                stroke="transparent"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number | undefined) => [
                              `$${formatNumber(value ?? 0)}`,
                              "",
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Gastos por categoría
                  </p>
                  {expenseByCategory.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No hay gastos categorizados este mes.
                    </p>
                  ) : (
                    <div style={{ minWidth: 1, minHeight: chartHeight }}>
                      <ResponsiveContainer width="100%" height={chartHeight}>
                        <PieChart>
                          <Pie
                            data={expenseByCategory}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            paddingAngle={2}
                            label={({ name, percent }) =>
                              `${name} ${(percent ?? 0 * 100).toFixed(0)}%`
                            }
                          >
                            {expenseByCategory.map((_, i) => (
                              <Cell
                                key={i}
                                fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                                stroke="transparent"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number | undefined) => [
                              `$${formatNumber(value ?? 0)}`,
                              "",
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tag" className="mt-2 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Ingresos por etiqueta
                  </p>
                  {incomeByTag.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No hay etiquetas asociadas a ingresos este mes.
                    </p>
                  ) : (
                    <div style={{ minWidth: 1, minHeight: chartHeight }}>
                      <ResponsiveContainer width="100%" height={chartHeight}>
                        <PieChart>
                          <Pie
                            data={incomeByTag}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            paddingAngle={2}
                            label={({ name, percent }) =>
                              `${name} ${(percent ?? 0 * 100).toFixed(0)}%`
                            }
                          >
                            {incomeByTag.map((_, i) => (
                              <Cell
                                key={i}
                                fill={TAG_COLORS[i % TAG_COLORS.length]}
                                stroke="transparent"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number | undefined) => [
                              `$${formatNumber(value ?? 0)}`,
                              "",
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Gastos por etiqueta
                  </p>
                  {expenseByTag.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No hay etiquetas asociadas a gastos este mes.
                    </p>
                  ) : (
                    <div style={{ minWidth: 1, minHeight: chartHeight }}>
                      <ResponsiveContainer width="100%" height={chartHeight}>
                        <PieChart>
                          <Pie
                            data={expenseByTag}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            paddingAngle={2}
                            label={({ name, percent }) =>
                              `${name} ${(percent ?? 0 * 100).toFixed(0)}%`
                            }
                          >
                            {expenseByTag.map((_, i) => (
                              <Cell
                                key={i}
                                fill={TAG_COLORS[i % TAG_COLORS.length]}
                                stroke="transparent"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number | undefined) => [
                              `$${formatNumber(value ?? 0)}`,
                              "",
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {allocations.length > 0 && (
          <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            {allocations.map((a) => (
              <div key={a.label} className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5">
                <span className="truncate">{a.label}</span>
                <span className="font-semibold text-foreground">
                  ${formatNumber(a.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

