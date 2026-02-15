"use client";

import { cn } from "@/lib/utils";

interface FilterBarProps {
  children: React.ReactNode;
  label?: string;
  description?: string;
  className?: string;
}

/** Contenedor para agrupar filtros con etiqueta y descripción opcional. Mejora la usabilidad. */
export function FilterBar({ children, label, description, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/30 px-4 py-3",
        className
      )}
    >
      {(label || description) && (
        <div className="space-y-0.5">
          {label && (
            <p className="text-sm font-medium text-foreground">{label}</p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

interface FilterFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

/** Etiqueta + control para un solo filtro (ej. "Ver datos de:", Select). */
export function FilterField({ label, children, className }: FilterFieldProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        {label}
      </span>
      {children}
    </div>
  );
}
