"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FilterField } from "@/components/ui/filter-bar";
import { Calendar } from "lucide-react";

type MonthPickerProps = {
  year: number;
  month: number;
};

export function MonthPicker({ year, month }: MonthPickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const value = `${year}-${String(month).padStart(2, "0")}`;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (!v) return;
    const [y, m] = v.split("-").map(Number);
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(y));
    params.set("month", String(m));
    router.push(`${window.location.pathname}?${params.toString()}`);
  }

  return (
    <FilterField label="Ver mes">
      <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm">
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          id="month-picker"
          type="month"
          value={value}
          onChange={handleChange}
          className="min-w-[140px] bg-transparent text-foreground outline-none [color-scheme:inherit]"
          aria-label="Seleccionar mes a consultar"
        />
      </div>
    </FilterField>
  );
}
