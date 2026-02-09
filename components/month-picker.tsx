"use client";

import { useRouter } from "next/navigation";

type MonthPickerProps = {
  year: number;
  month: number;
};

export function MonthPicker({ year, month }: MonthPickerProps) {
  const router = useRouter();

  const value = `${year}-${String(month).padStart(2, "0")}`;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (!v) return;
    const [y, m] = v.split("-").map(Number);
    router.push(`${window.location.pathname}?year=${y}&month=${m}`);
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
