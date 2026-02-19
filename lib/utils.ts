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

export function formatCurrency(amount: number | string, currency: string = "COP") {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) || 0 : amount;
  const prefix = currency === "COP" ? "$" : `${currency} `;
  return `${prefix}${formatNumber(numericAmount)}`;
}

/**
 * Formats a number or string into a currency string with dots as thousands separators
 * and preserves decimals.
 */
export function formatCOP(value: string | number): string {
  if (value === "" || value === undefined || value === null) return "";

  const strValue = typeof value === "number" ? value.toFixed(2) : value.replace(/,/g, ".");
  const [integerPart, decimalPart] = strValue.split(".");

  const cleanInteger = integerPart.replace(/\D/g, "");
  if (!cleanInteger && !decimalPart) return "";

  const formattedInteger = formatNumber(cleanInteger || "0");

  // Only show decimals if they exist and are not "00" (or similar depending on context, 
  // but for now let's show them if they were explicitly provided or exist in number)
  if (decimalPart !== undefined) {
    return `${formattedInteger},${decimalPart.slice(0, 2)}`;
  }

  return formattedInteger;
}

/**
 * Strips non-numeric characters but preserves the first decimal separator.
 */
export function parseCOP(value: string): string {
  const sanitized = value.replace(/,/g, ".");
  const parts = sanitized.split(".");
  if (parts.length > 1) {
    return parts[0].replace(/\D/g, "") + "." + parts[1].replace(/\D/g, "").slice(0, 2);
  }
  return sanitized.replace(/\D/g, "");
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
