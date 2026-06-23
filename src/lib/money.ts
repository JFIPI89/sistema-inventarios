import { addMonths, addWeeks } from "date-fns";
import type { CreditPeriodUnit } from "@prisma/client";

/** Convert display amount to integer cents (half-up). */
export function toCents(amount: number | string): number {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Convert integer cents to display number (UI only). */
export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatCents(cents: number): string {
  const symbol = process.env.CURRENCY_SYMBOL || "$";
  const whole = Math.trunc(cents / 100);
  const frac = Math.abs(cents % 100);
  return `${symbol}${whole}.${String(frac).padStart(2, "0")}`;
}

/** Split totalCents into n installments; remainder goes to last installment. */
export function splitInstallments(totalCents: number, count: number): number[] {
  if (count < 1) throw new Error("installmentCount debe ser al menos 1");
  if (totalCents < 0) throw new Error("totalCents no puede ser negativo");

  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  const amounts = Array.from({ length: count }, () => base);
  if (count > 0 && remainder > 0) {
    amounts[count - 1] += remainder;
  }
  return amounts;
}

export function addDueDate(
  start: Date,
  installmentIndex: number,
  unit: CreditPeriodUnit
): Date {
  const i = installmentIndex;
  return unit === "WEEKS" ? addWeeks(start, i) : addMonths(start, i);
}

export function sumCents(values: number[]): number {
  return values.reduce((s, v) => s + v, 0);
}

export function installmentStatusFromPaid(
  amountCents: number,
  paidCents: number,
  dueDate: Date,
  now = new Date()
): "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" {
  if (paidCents >= amountCents) return "PAID";
  if (paidCents > 0) {
    return dueDate < now ? "OVERDUE" : "PARTIAL";
  }
  return dueDate < now ? "OVERDUE" : "PENDING";
}

export function buildInstallmentPreview(
  totalCents: number,
  installmentCount: number,
  periodUnit: CreditPeriodUnit,
  startDate: Date
) {
  const amounts = splitInstallments(totalCents, installmentCount);
  return amounts.map((amountCents, i) => ({
    number: i + 1,
    amountCents,
    dueDate: addDueDate(startDate, i, periodUnit),
  }));
}
