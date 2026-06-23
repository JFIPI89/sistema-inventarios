import { CreditPlanStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  type AgingBuckets,
  type CreditRating,
  computeAgingFromPlans,
  computeCreditRating,
  collectionRatePercent,
  installmentRemaining,
  type PlanRow,
} from "@/lib/credit-metrics";
import { addDays, startOfDay } from "date-fns";

export type CreditReportData = {
  summary: {
    activePlans: number;
    totalPortfolioCents: number;
    totalOutstandingCents: number;
    totalCollectedCents: number;
    collectedInPeriodCents: number;
    paymentsInPeriodCount: number;
    overdueInstallmentsCount: number;
    overdueAmountCents: number;
    newPlansInPeriod: number;
    newPlansAmountCents: number;
    collectionRatePercent: number;
    dueNext7Cents: number;
    dueNext30Cents: number;
  };
  agingBuckets: AgingBuckets;
  byCustomer: Array<{
    customerId: string;
    name: string;
    code: string;
    activePlans: number;
    outstandingCents: number;
    overdueCents: number;
    creditLimitCents: number | null;
    availableCents: number | null;
    rating: CreditRating;
    ratingLabel: string;
    onTimePercent: number;
  }>;
  overdueInstallments: Array<{
    planId: string;
    planNumber: string;
    customerName: string;
    customerCode: string;
    installmentNumber: number;
    dueDate: Date;
    amountCents: number;
    paidCents: number;
    remainingCents: number;
  }>;
  upcomingInstallments: Array<{
    planId: string;
    planNumber: string;
    customerName: string;
    installmentNumber: number;
    dueDate: Date;
    remainingCents: number;
  }>;
  paymentsInPeriod: Array<{
    paidAt: Date;
    planNumber: string;
    customerName: string;
    installmentNumber: number;
    amountCents: number;
    paymentMethod: string;
    userName: string;
  }>;
  collectionsChart: Array<{ date: string; totalCents: number; count: number }>;
};

type ActivePlan = Awaited<ReturnType<typeof loadActivePlans>>[number];

async function loadActivePlans() {
  return prisma.creditPlan.findMany({
    where: { status: CreditPlanStatus.ACTIVE },
    include: {
      customer: true,
      installments: true,
    },
  });
}

export function collectUpcomingInstallments(
  plans: ActivePlan[],
  now = new Date(),
  withinDays = 30,
  periodStart?: Date,
  periodEnd?: Date
): CreditReportData["upcomingInstallments"] {
  const horizon = addDays(startOfDay(now), withinDays);
  const today = startOfDay(now);
  const results: CreditReportData["upcomingInstallments"] = [];

  for (const plan of plans) {
    for (const inst of plan.installments) {
      const remaining = installmentRemaining(inst);
      if (remaining <= 0) continue;
      const dueDay = startOfDay(inst.dueDate);
      if (dueDay < today || dueDay > horizon) continue;
      if (periodStart && periodEnd) {
        const start = startOfDay(periodStart);
        const end = startOfDay(periodEnd);
        if (dueDay < start || dueDay > end) continue;
      }
      results.push({
        planId: plan.id,
        planNumber: plan.planNumber,
        customerName: plan.customer.name,
        installmentNumber: inst.number,
        dueDate: inst.dueDate,
        remainingCents: remaining,
      });
    }
  }

  return results.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export async function getCustomerOutstandingCents(customerId: string) {
  const plans = await prisma.creditPlan.findMany({
    where: { customerId, status: CreditPlanStatus.ACTIVE },
    include: { installments: true },
  });
  let outstanding = 0;
  for (const plan of plans) {
    for (const inst of plan.installments) {
      outstanding += installmentRemaining(inst);
    }
  }
  return outstanding;
}

export async function loadCreditReportData(
  startDate: string,
  endDate: string
): Promise<CreditReportData> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const now = new Date();
  const in7 = addDays(startOfDay(now), 7);
  const in30 = addDays(startOfDay(now), 30);

  const [activePlans, payments, newPlansInPeriod, customerPlans] = await Promise.all([
    loadActivePlans(),
    prisma.creditPayment.findMany({
      where: { paidAt: { gte: start, lte: end } },
      include: {
        user: { select: { name: true } },
        installment: {
          include: {
            creditPlan: { include: { customer: true } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    }),
    prisma.creditPlan.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { totalCents: true },
    }),
    prisma.creditPlan.findMany({
      where: { status: { in: [CreditPlanStatus.ACTIVE, CreditPlanStatus.PAID] } },
      include: {
        installments: {
          include: { payments: { orderBy: { paidAt: "desc" } } },
        },
      },
    }),
  ]);

  const customerInstallments = new Map<string, (typeof customerPlans)[0]["installments"]>();
  for (const plan of customerPlans) {
    const list = customerInstallments.get(plan.customerId) ?? [];
    list.push(...plan.installments);
    customerInstallments.set(plan.customerId, list);
  }

  let totalPortfolioCents = 0;
  let totalOutstandingCents = 0;
  let totalCollectedCents = 0;
  let overdueInstallmentsCount = 0;
  let overdueAmountCents = 0;
  let dueNext7Cents = 0;
  let dueNext30Cents = 0;

  const customerMap = new Map<
    string,
    {
      name: string;
      code: string;
      creditLimitCents: number | null;
      activePlans: number;
      outstandingCents: number;
      overdueCents: number;
    }
  >();

  const overdueInstallments: CreditReportData["overdueInstallments"] = [];

  const planRows: PlanRow[] = activePlans.map((p) => ({
    id: p.id,
    planNumber: p.planNumber,
    customerId: p.customerId,
    totalCents: p.totalCents,
    status: p.status,
    installments: p.installments,
  }));

  const agingBuckets = computeAgingFromPlans(planRows, now);

  for (const plan of activePlans) {
    totalPortfolioCents += plan.totalCents;
    let planOutstanding = 0;
    let planOverdue = 0;
    let planCollected = 0;

    for (const inst of plan.installments) {
      const remaining = installmentRemaining(inst);
      planCollected += inst.paidCents;
      planOutstanding += remaining;

      const dueDay = startOfDay(inst.dueDate);
      const today = startOfDay(now);

      if (remaining > 0 && inst.status === "OVERDUE") {
        overdueInstallmentsCount += 1;
        overdueAmountCents += remaining;
        planOverdue += remaining;
        overdueInstallments.push({
          planId: plan.id,
          planNumber: plan.planNumber,
          customerName: plan.customer.name,
          customerCode: plan.customer.code,
          installmentNumber: inst.number,
          dueDate: inst.dueDate,
          amountCents: inst.amountCents,
          paidCents: inst.paidCents,
          remainingCents: remaining,
        });
      }

      if (remaining > 0 && dueDay >= today && dueDay <= in7) {
        dueNext7Cents += remaining;
      }
      if (remaining > 0 && dueDay >= today && dueDay <= in30) {
        dueNext30Cents += remaining;
      }
    }

    totalOutstandingCents += planOutstanding;
    totalCollectedCents += planCollected;

    const key = plan.customerId;
    const existing = customerMap.get(key);
    if (existing) {
      existing.activePlans += 1;
      existing.outstandingCents += planOutstanding;
      existing.overdueCents += planOverdue;
    } else {
      customerMap.set(key, {
        name: plan.customer.name,
        code: plan.customer.code,
        creditLimitCents: plan.customer.creditLimitCents,
        activePlans: 1,
        outstandingCents: planOutstanding,
        overdueCents: planOverdue,
      });
    }
  }

  overdueInstallments.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const upcomingInstallments = collectUpcomingInstallments(activePlans, now, 30, start, end);

  const chartMap: Record<string, { date: string; totalCents: number; count: number }> = {};
  for (const p of payments) {
    const key = p.paidAt.toISOString().slice(0, 10);
    if (!chartMap[key]) chartMap[key] = { date: key, totalCents: 0, count: 0 };
    chartMap[key].totalCents += p.amountCents;
    chartMap[key].count += 1;
  }

  const collectedInPeriodCents = payments.reduce((s, p) => s + p.amountCents, 0);
  const newPlansAmountCents = newPlansInPeriod.reduce((s, p) => s + p.totalCents, 0);

  return {
    summary: {
      activePlans: activePlans.length,
      totalPortfolioCents,
      totalOutstandingCents,
      totalCollectedCents,
      collectedInPeriodCents,
      paymentsInPeriodCount: payments.length,
      overdueInstallmentsCount,
      overdueAmountCents,
      newPlansInPeriod: newPlansInPeriod.length,
      newPlansAmountCents,
      collectionRatePercent: collectionRatePercent(totalPortfolioCents, totalCollectedCents),
      dueNext7Cents,
      dueNext30Cents,
    },
    agingBuckets,
    byCustomer: Array.from(customerMap.entries())
      .map(([customerId, row]) => {
        const insts = customerInstallments.get(customerId) ?? [];
        const { rating, onTimePercent, label } = computeCreditRating(insts, now);
        const availableCents =
          row.creditLimitCents != null
            ? Math.max(0, row.creditLimitCents - row.outstandingCents)
            : null;
        return {
          customerId,
          ...row,
          availableCents,
          rating,
          ratingLabel: label,
          onTimePercent,
        };
      })
      .sort((a, b) => b.outstandingCents - a.outstandingCents),
    overdueInstallments,
    upcomingInstallments,
    paymentsInPeriod: payments.map((p) => ({
      paidAt: p.paidAt,
      planNumber: p.installment.creditPlan.planNumber,
      customerName: p.installment.creditPlan.customer.name,
      installmentNumber: p.installment.number,
      amountCents: p.amountCents,
      paymentMethod: p.paymentMethod,
      userName: p.user.name,
    })),
    collectionsChart: Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date)),
  };
}
