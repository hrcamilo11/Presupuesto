"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FilterBar } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "Todas", hint: "Todas las obligaciones" },
  { value: "pending", label: "Pendientes", hint: "Aún no pagadas" },
  { value: "overdue", label: "Vencidas", hint: "Fecha de vencimiento ya pasada" },
] as const;

export function TaxFilter({ currentFilter }: { currentFilter: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("filter");
    else params.set("filter", value);
    router.push(`/taxes?${params.toString()}`);
  }

  return (
    <FilterBar
      label="Filtrar obligaciones"
      description="Filtra por estado de pago: todas, solo pendientes o solo vencidas."
    >
      <div
        className="inline-flex rounded-lg border border-input bg-muted/50 p-1 shadow-sm"
        role="group"
        aria-label="Filtro de estado de impuestos"
      >
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant="ghost"
            size="sm"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-md text-sm font-medium transition-colors",
              currentFilter === f.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={f.hint}
          >
            {f.label}
          </Button>
        ))}
      </div>
    </FilterBar>
  );
}
