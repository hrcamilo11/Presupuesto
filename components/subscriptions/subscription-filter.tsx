"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FilterBar } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "Todas", hint: "Todas las suscripciones" },
  { value: "next30", label: "Próximos 30 días", hint: "Las que vencen en el próximo mes" },
  { value: "overdue", label: "Vencidas", hint: "Fecha de pago ya pasada" },
] as const;

export function SubscriptionFilter({ currentFilter }: { currentFilter: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("filter");
    else params.set("filter", value);
    router.push(`/subscriptions?${params.toString()}`);
  }

  return (
    <FilterBar
      label="Filtrar suscripciones"
      description="Elige qué suscripciones ver según su fecha de próximo pago."
    >
      <div
        className="inline-flex rounded-lg border border-input bg-muted/50 p-1 shadow-sm"
        role="group"
        aria-label="Filtro de estado de suscripciones"
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
