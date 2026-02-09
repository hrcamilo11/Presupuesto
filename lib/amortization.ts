/**
 * Calcula la cuota mensual fija (método francés).
 * PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function monthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (termMonths <= 0) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / termMonths;
  const factor = Math.pow(1 + r, termMonths);
  return (principal * r * factor) / (factor - 1);
}

export interface AmortizationRow {
  paymentNumber: number;
  dueDate: string;
  payment: number;
  principalPortion: number;
  interestPortion: number;
  balanceAfter: number;
}

/**
 * Genera la tabla de amortización (lista de cuotas).
 */
export function getAmortizationSchedule(
  principal: number,
  annualRate: number,
  termMonths: number,
  startDate: string
): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  const payment = monthlyPayment(principal, annualRate, termMonths);
  const r = annualRate / 12 / 100;
  let balance = principal;
  const start = new Date(startDate);

  for (let n = 1; n <= termMonths; n++) {
    const interestPortion = balance * r;
    const principalPortion = Math.min(payment - interestPortion, balance);
    balance = Math.max(0, balance - principalPortion);
    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + n);
    schedule.push({
      paymentNumber: n,
      dueDate: dueDate.toISOString().slice(0, 10),
      payment: principalPortion + interestPortion,
      principalPortion,
      interestPortion,
      balanceAfter: balance,
    });
  }
  return schedule;
}
