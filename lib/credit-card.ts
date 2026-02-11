/**
 * Utilidades para tarjetas de crédito: fechas de corte/pago y tabla de amortización.
 */

/**
 * Obtiene la próxima fecha de corte a partir del día de corte (1-31).
 * Si hoy es antes del día de corte este mes, el próximo corte es este mes; si no, el siguiente.
 */
export function getNextCutDate(cutOffDay: number): Date {
  const today = new Date();
  const day = today.getDate();
  const next = new Date(today.getFullYear(), today.getMonth(), cutOffDay);
  if (day < cutOffDay) return next;
  next.setMonth(next.getMonth() + 1);
  return next;
}

/**
 * Obtiene la próxima fecha de pago a partir del día de pago (1-31).
 * Si no se pasa paymentDueDay, se usa cutOffDay + 20 como aproximación (comportamiento típico).
 */
export function getNextPaymentDueDate(
  cutOffDay: number,
  paymentDueDay?: number | null
): Date {
  const dayToUse = paymentDueDay ?? Math.min(31, cutOffDay + 20);
  const today = new Date();
  const day = today.getDate();
  const next = new Date(today.getFullYear(), today.getMonth(), dayToUse);
  if (day < dayToUse) return next;
  next.setMonth(next.getMonth() + 1);
  return next;
}

export interface CreditCardAmortizationRow {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balanceAfter: number;
  dueDate: string;
}

/**
 * Genera la tabla de amortización para una tarjeta de crédito:
 * pago mensual fijo, interés sobre saldo (tasa anual en %), hasta saldar.
 * Fechas de vencimiento desde startDate (mes 1, 2, ...).
 */
export function getCreditCardAmortizationSchedule(
  currentBalance: number,
  annualRatePercent: number,
  monthlyPayment: number,
  startDate: Date = new Date()
): CreditCardAmortizationRow[] {
  const schedule: CreditCardAmortizationRow[] = [];
  const monthlyRate = annualRatePercent / 12 / 100;
  let balance = currentBalance;
  let month = 0;

  if (monthlyPayment <= 0 || currentBalance <= 0) return schedule;

  // Pago mínimo debe cubrir al menos el interés del primer mes para no divergir
  const minPayment = balance * monthlyRate;
  if (monthlyPayment < minPayment) {
    return schedule;
  }

  const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (balance > 0.01 && month < 360) {
    month++;
    const interest = balance * monthlyRate;
    const principal = Math.min(monthlyPayment - interest, balance);
    balance = Math.max(0, balance - principal);
    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + month);

    schedule.push({
      month,
      payment: principal + interest,
      interest,
      principal,
      balanceAfter: balance,
      dueDate: dueDate.toISOString().slice(0, 10),
    });
  }

  return schedule;
}

/**
 * Formatea una fecha para mostrar (corta, ej. "15 mar").
 */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
  });
}
