import Link from "next/link";
import { Sparkles, AlertCircle, ThumbsUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  balance: number;
  savingsRate: number;
  totalIncome: number;
  totalExpense: number;
};

export function DashboardSummaryBanner({ balance, savingsRate, totalIncome, totalExpense }: Props) {
  const hasData = totalIncome > 0 || totalExpense > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium">Comienza a registrar tus finanzas</p>
            <p className="text-sm text-muted-foreground">
              Añade tu primer ingreso o gasto para ver tu resumen y gráficas.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href="/incomes">Agregar ingreso</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/expenses">Agregar gasto</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (balance < 0) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium">Este mes gastaste más de lo que ingresaste</p>
            <p className="text-sm text-muted-foreground">
              Revisa gastos opcionales o necesarios para volver al superávit.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto sm:shrink-0">
          <Link href="/expenses">Ver gastos</Link>
        </Button>
      </div>
    );
  }

  if (savingsRate >= 20) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-green-500/30 bg-green-500/5 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
            <ThumbsUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium">¡Muy bien! Este mes vas por buen camino</p>
            <p className="text-sm text-muted-foreground">
              Tu tasa de ahorro es del {savingsRate}%. Sigue así.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-muted/30 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-medium">Tienes superávit este mes</p>
          <p className="text-sm text-muted-foreground">
            Si quieres ahorrar más, revisa gastos opcionales.
          </p>
        </div>
      </div>
      <Button asChild variant="ghost" size="sm" className="w-full sm:w-auto sm:shrink-0">
        <Link href="/expenses">Ver gastos</Link>
      </Button>
    </div>
  );
}
