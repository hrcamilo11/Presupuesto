import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un número con separadores de miles por puntos.
 * Ej: 1000000 -> "1.000.000"
 */
export function formatNumber(value: number | string): string {
  const n = typeof value === "string" ? Number(value) || 0 : Number(value) || 0;
  const int = Math.round(n);
  const str = Math.abs(int).toString();
  const withDots = str.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = int < 0 ? "-" : "";
  return `${sign}${withDots}`;
}

export function formatCurrency(amount: number, currency: string = "COP") {
  const prefix = currency === "COP" ? "$" : `${currency} `;
  return `${prefix}${formatNumber(amount)}`;
}

/**
 * Formats a number or string into a COP currency string with dots as thousands separators.
 * Example: 1000000 -> "1.000.000"
 */
export function formatCOP(value: string | number): string {
  const numericValue =
    typeof value === "string" ? value.replace(/\D/g, "") : String(Math.floor(Number(value) || 0));
  if (!numericValue) return "";
  return formatNumber(numericValue);
}

/**
 * Strips all non-numeric characters from a string.
 */
export function parseCOP(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Formatea una fecha "YYYY-MM-DD" a "DD/MM/YYYY" sin depender de la zona horaria.
 */
export function formatDateYMD(value?: string | null): string {
  if (!value) return "—";
  const [y, m, d] = value.split("T")[0].split("-");
  if (!y || !m || !d) return value;
  return `${Number(d)}/${Number(m)}/${y}`;
}
