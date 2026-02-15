"use client";

import { useRouter, useSearchParams } from "next/navigation";

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
    <div className="flex gap-2 items-center">
      <label htmlFor="month" className="text-sm text-muted-foreground">
        Mes:
      </label>
      <input
        id="month"
        type="month"
        value={value}
        onChange={handleChange}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}
