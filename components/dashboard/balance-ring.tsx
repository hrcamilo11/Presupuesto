"use client";

import { useEffect, useState } from "react";

type Props = {
  balance: number;
  totalIncome: number;
  totalExpense: number;
};

export function BalanceRing({ balance, totalIncome, totalExpense }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const total = totalIncome + totalExpense || 1;
  const incomeShare = total > 0 ? (totalIncome / total) * 100 : 50;
  const expenseShare = total > 0 ? (totalExpense / total) * 100 : 50;
  const size = 140;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const incomeLength = (incomeShare / 100) * circumference;
  const expenseLength = (expenseShare / 100) * circumference;

  if (!mounted) {
    return (
      <div className="flex h-[180px] items-center justify-center">
        <div className="h-[140px] w-[140px] animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted/40"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#22c55e"
            strokeWidth={stroke}
            strokeDasharray={`${incomeLength} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#ef4444"
            strokeWidth={stroke}
            strokeDasharray={`${expenseLength} ${circumference}`}
            strokeDashoffset={-incomeLength}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">
            ${Math.abs(balance).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 0 })}
          </span>
          <span className="text-xs text-muted-foreground">{balance >= 0 ? "Superávit" : "Déficit"}</span>
        </div>
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
