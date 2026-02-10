import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a number or string into a COP currency string with dots as thousands separators.
 * Example: 1000000 -> "1.000.000"
 */
export function formatCOP(value: string | number): string {
  const numericValue = typeof value === "string" ? value.replace(/\D/g, "") : String(Math.floor(value));
  if (!numericValue) return "";

  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(numericValue));
}

/**
 * Strips all non-numeric characters from a string.
 */
export function parseCOP(value: string): string {
  return value.replace(/\D/g, "");
}
