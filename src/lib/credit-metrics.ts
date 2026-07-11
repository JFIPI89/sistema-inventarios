import {
  calendarDaysBetween,
  toCalendarDateKey,
  toDateKey,
} from "@/lib/timezone";

export type CreditRating = "A" | "B" | "C" | "D" | null;

export type AgingBuckets = {
  alDia: number;
  vencido_1_7: number;
  vencido_8_30: number;
  vencido_31_60: number;
  vencido_60_plus: number;
};

export const EMPTY_AGING: AgingBuckets = {
  alDia: 0,
  vencido_1_7: 0,
  vencido_8_30: 0,
  vencido_31_60: 0,
  vencido_60_plus: 0,
};

export type InstallmentRow = {
  id: string;
  number: number;
  dueDate: Date;
  amountCents: number;
  paidCents: number;
  status: string;
  payments?: { paidAt: Date }[];
};

export type PlanRow = {
  id: string;
  planNumber: string;
  customerId: string;
  totalCents: number;
  status: string;
  installments: InstallmentRow[];
};

export function installmentRemaining(inst: Pick<InstallmentRow, "amountCents" | "paidCents">) {
  return Math.max(0, inst.amountCents - inst.paidCents);
}

export function addToAging(buckets: AgingBuckets, remainingCents: number, dueDate: Date, now = new Date()) {
  if (remainingCents <= 0) return;
  const todayKey = toDateKey(now);
  const dueKey = toCalendarDateKey(dueDate);
  if (dueKey >= todayKey) {
    buckets.alDia += remainingCents;
    return;
  }
  const days = calendarDaysBetween(dueKey, todayKey);
  if (days <= 7) buckets.vencido_1_7 += remainingCents;
  else if (days <= 30) buckets.vencido_8_30 += remainingCents;
  else if (days <= 60) buckets.vencido_31_60 += remainingCents;
  else buckets.vencido_60_plus += remainingCents;
}

export function computeAgingFromPlans(plans: PlanRow[], now = new Date()): AgingBuckets {
  const buckets = { ...EMPTY_AGING };
  for (const plan of plans) {
    if (plan.status !== "ACTIVE") continue;
    for (const inst of plan.installments) {
      addToAging(buckets, installmentRemaining(inst), inst.dueDate, now);
    }
  }
  return buckets;
}

export function isInstallmentPaidOnTime(inst: InstallmentRow): boolean | null {
  if (inst.paidCents < inst.amountCents) return null;
  const dueKey = toCalendarDateKey(inst.dueDate);
  if (!inst.payments?.length) {
    return toDateKey(new Date()) <= dueKey;
  }
  const lastPaid = inst.payments.reduce(
    (max, p) => (p.paidAt > max ? p.paidAt : max),
    inst.payments[0]!.paidAt
  );
  return toDateKey(lastPaid) <= dueKey;
}

export function computeCreditRating(
  installments: InstallmentRow[],
  now = new Date()
): { rating: CreditRating; onTimePercent: number; label: string } {
  const evaluable = installments.filter((i) => i.paidCents >= i.amountCents);
  if (evaluable.length === 0) {
    return { rating: null, onTimePercent: 0, label: "Sin historial" };
  }

  let onTime = 0;
  for (const inst of evaluable) {
    if (isInstallmentPaidOnTime(inst) === true) onTime += 1;
  }
  const onTimePercent = Math.round((onTime / evaluable.length) * 100);

  const todayKey = toDateKey(now);
  const openOverdue = installments.filter(
    (i) => installmentRemaining(i) > 0 && toCalendarDateKey(i.dueDate) < todayKey
  );
  const maxOverdueDays = openOverdue.reduce((max, i) => {
    const days = calendarDaysBetween(toCalendarDateKey(i.dueDate), todayKey);
    return Math.max(max, days);
  }, 0);

  let rating: CreditRating;
  if (onTimePercent < 60 || maxOverdueDays > 30) rating = "D";
  else if (openOverdue.length > 0) rating = "C";
  else if (onTimePercent >= 95) rating = "A";
  else if (onTimePercent >= 80) rating = "B";
  else rating = "C";

  const labels: Record<Exclude<CreditRating, null>, string> = {
    A: "Excelente",
    B: "Bueno",
    C: "Regular",
    D: "Riesgo",
  };

  return {
    rating,
    onTimePercent,
    label: rating ? labels[rating] : "Sin historial",
  };
}

export function collectionRatePercent(totalPortfolioCents: number, collectedCents: number) {
  if (totalPortfolioCents <= 0) return 0;
  return Math.round((collectedCents / totalPortfolioCents) * 1000) / 10;
}

export const RATING_LABELS: Record<Exclude<CreditRating, null>, string> = {
  A: "Excelente",
  B: "Bueno",
  C: "Regular",
  D: "Riesgo",
};
