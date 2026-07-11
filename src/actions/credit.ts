"use server";

import { revalidatePath } from "next/cache";
import {
  CreditPeriodUnit,
  CreditPlanStatus,
  PaymentMethod,
  Role,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canWriteSales } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import {
  addDueDate,
  formatCents,
  installmentStatusFromPaid,
  splitInstallments,
  toCents,
} from "@/lib/money";
import {
  collectUpcomingInstallments,
  getCustomerOutstandingCents,
  loadCreditReportData,
  type CreditReportData,
} from "@/lib/credit-report";
import { computeCreditRating } from "@/lib/credit-metrics";
import { defaultDateRangeDays, parseAppDate } from "@/lib/timezone";

async function requireSalesWrite() {
  const session = await getSession();
  if (!session || !canWriteSales(session.role)) {
    throw new Error("No autorizado");
  }
  return session;
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    throw new Error("No autorizado");
  }
  return session;
}

export async function generatePlanNumber(tx: Prisma.TransactionClient) {
  const count = await tx.creditPlan.count();
  const year = new Date().getFullYear();
  return `CR-${year}-${String(count + 1).padStart(5, "0")}`;
}

export type CreditPlanInput = {
  customerId: string;
  totalCents: number;
  installmentCount: number;
  periodUnit: CreditPeriodUnit;
  startDate: Date;
  notes?: string | null;
  saleId?: string | null;
  createdById: string;
};

export async function createCreditPlanInTx(
  tx: Prisma.TransactionClient,
  input: CreditPlanInput
) {
  if (input.installmentCount < 1 || input.installmentCount > 52) {
    throw new Error("Cantidad de cuotas debe estar entre 1 y 52");
  }
  if (input.totalCents <= 0) {
    throw new Error("El monto debe ser mayor a cero");
  }

  const amounts = splitInstallments(input.totalCents, input.installmentCount);
  const planNumber = await generatePlanNumber(tx);

  const plan = await tx.creditPlan.create({
    data: {
      planNumber,
      customerId: input.customerId,
      saleId: input.saleId ?? null,
      createdById: input.createdById,
      totalCents: input.totalCents,
      installmentCount: input.installmentCount,
      periodUnit: input.periodUnit,
      startDate: input.startDate,
      notes: input.notes ?? null,
      status: CreditPlanStatus.ACTIVE,
    },
  });

  for (let i = 0; i < input.installmentCount; i++) {
    const number = i + 1;
    await tx.creditInstallment.create({
      data: {
        creditPlanId: plan.id,
        number,
        dueDate: addDueDate(input.startDate, i, input.periodUnit),
        amountCents: amounts[i]!,
        paidCents: 0,
        status: "PENDING",
      },
    });
  }

  return plan;
}

export async function createCreditPlanManual(data: {
  customerId: string;
  totalAmount: number;
  installmentCount: number;
  periodUnit: CreditPeriodUnit;
  startDate: string;
  notes?: string;
}) {
  const session = await requireSalesWrite();

  const startDate = parseAppDate(data.startDate);
  if (Number.isNaN(startDate.getTime())) return { error: "Fecha inválida" };

  const totalCents = toCents(data.totalAmount);

  try {
    const plan = await prisma.$transaction(async (tx) => {
      await assertCreditLimit(data.customerId, totalCents, tx);
      return createCreditPlanInTx(tx, {
        customerId: data.customerId,
        totalCents,
        installmentCount: data.installmentCount,
        periodUnit: data.periodUnit,
        startDate,
        notes: data.notes,
        createdById: session.id,
      });
    });

    await logAudit({
      session,
      action: "CREATE",
      entityType: "CreditPlan",
      entityId: plan.id,
      entityLabel: plan.planNumber,
      summary: `Cartera manual ${plan.planNumber} — ${formatCents(totalCents)} (${data.installmentCount} cuotas)`,
    });

    revalidatePath("/credit");
    revalidatePath(`/customers/${data.customerId}`);
    return { success: true, planId: plan.id, planNumber: plan.planNumber };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al crear cartera" };
  }
}

export async function getCreditPlans(search?: string, status?: CreditPlanStatus) {
  await requireSalesWrite();

  return prisma.creditPlan.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { planNumber: { contains: search, mode: "insensitive" } },
              { customer: { name: { contains: search, mode: "insensitive" } } },
              { customer: { code: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      customer: true,
      installments: { orderBy: { number: "asc" } },
      sale: { select: { saleNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getCreditPlan(id: string) {
  await requireSalesWrite();

  return prisma.creditPlan.findUnique({
    where: { id },
    include: {
      customer: true,
      sale: { select: { id: true, saleNumber: true, total: true } },
      createdBy: { select: { name: true } },
      installments: {
        orderBy: { number: "asc" },
        include: {
          payments: {
            orderBy: { paidAt: "desc" },
            include: { user: { select: { name: true } } },
          },
        },
      },
    },
  });
}

export async function getCustomerCreditPlans(customerId: string) {
  await requireSalesWrite();

  return prisma.creditPlan.findMany({
    where: { customerId },
    include: { installments: { orderBy: { number: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export async function getCustomerCreditSummary(customerId: string) {
  const plans = await prisma.creditPlan.findMany({
    where: {
      customerId,
      status: CreditPlanStatus.ACTIVE,
    },
    include: { installments: true },
  });

  let pendingCents = 0;
  for (const plan of plans) {
    for (const inst of plan.installments) {
      pendingCents += Math.max(0, inst.amountCents - inst.paidCents);
    }
  }

  return { activePlans: plans.length, pendingCents };
}

async function refreshInstallmentStatus(
  tx: Prisma.TransactionClient,
  installmentId: string
) {
  const inst = await tx.creditInstallment.findUnique({ where: { id: installmentId } });
  if (!inst) return;

  const status = installmentStatusFromPaid(inst.amountCents, inst.paidCents, inst.dueDate);
  await tx.creditInstallment.update({
    where: { id: installmentId },
    data: { status },
  });
}

async function refreshPlanStatus(tx: Prisma.TransactionClient, planId: string) {
  const installments = await tx.creditInstallment.findMany({
    where: { creditPlanId: planId },
  });

  const allPaid = installments.every((i) => i.paidCents >= i.amountCents);
  if (allPaid) {
    await tx.creditPlan.update({
      where: { id: planId },
      data: { status: CreditPlanStatus.PAID },
    });
  }
}

export async function registerCreditPayment(data: {
  installmentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}) {
  const session = await requireSalesWrite();

  const amountCents = toCents(data.amount);
  if (amountCents <= 0) return { error: "El abono debe ser mayor a cero" };

  const installment = await prisma.creditInstallment.findUnique({
    where: { id: data.installmentId },
    include: { creditPlan: true },
  });

  if (!installment) return { error: "Cuota no encontrada" };
  if (installment.creditPlan.status === CreditPlanStatus.CANCELLED) {
    return { error: "El plan está cancelado" };
  }

  const remaining = installment.amountCents - installment.paidCents;
  if (amountCents > remaining) {
    return { error: `El abono excede el saldo de la cuota (${formatCents(remaining)})` };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.creditPayment.create({
        data: {
          installmentId: data.installmentId,
          amountCents,
          paymentMethod: data.paymentMethod,
          userId: session.id,
          notes: data.notes?.trim() || null,
        },
      });

      const newPaidCents = installment.paidCents + amountCents;
      await tx.creditInstallment.update({
        where: { id: data.installmentId },
        data: { paidCents: newPaidCents },
      });

      await refreshInstallmentStatus(tx, data.installmentId);
      await refreshPlanStatus(tx, installment.creditPlanId);
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al registrar abono" };
  }

  await logAudit({
    session,
    action: "CREATE",
    entityType: "CreditPayment",
    entityId: data.installmentId,
    entityLabel: installment.creditPlan.planNumber,
    summary: `Abono ${formatCents(amountCents)} a cuota ${installment.number} (${installment.creditPlan.planNumber})`,
  });

  revalidatePath("/credit");
  revalidatePath(`/credit/${installment.creditPlanId}`);
  revalidatePath(`/customers/${installment.creditPlan.customerId}`);
  return { success: true };
}

export async function cancelCreditPlan(id: string) {
  const session = await requireAdmin();

  const plan = await prisma.creditPlan.findUnique({ where: { id } });
  if (!plan) return { error: "Plan no encontrado" };
  if (plan.status === CreditPlanStatus.CANCELLED) {
    return { error: "El plan ya está cancelado" };
  }

  await prisma.creditPlan.update({
    where: { id },
    data: { status: CreditPlanStatus.CANCELLED },
  });

  await logAudit({
    session,
    action: "CANCEL",
    entityType: "CreditPlan",
    entityId: id,
    entityLabel: plan.planNumber,
    summary: `Canceló cartera ${plan.planNumber}`,
  });

  revalidatePath("/credit");
  revalidatePath(`/credit/${id}`);
  revalidatePath(`/customers/${plan.customerId}`);
  return { success: true };
}

export async function assertCreditLimit(
  customerId: string,
  newAmountCents: number,
  db: Prisma.TransactionClient | typeof prisma = prisma
) {
  const customer = await db.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error("Cliente no encontrado");
  if (!customer.isActive) throw new Error("El cliente está inactivo");
  if (customer.creditLimitCents == null) return;

  const plans = await db.creditPlan.findMany({
    where: { customerId, status: CreditPlanStatus.ACTIVE },
    include: { installments: true },
  });
  let used = 0;
  for (const plan of plans) {
    for (const inst of plan.installments) {
      used += Math.max(0, inst.amountCents - inst.paidCents);
    }
  }

  const limit = customer.creditLimitCents;
  const available = Math.max(0, limit - used);

  if (used + newAmountCents > limit) {
    throw new Error(
      `Tope de crédito excedido. Usado: ${formatCents(used)}, tope: ${formatCents(limit)}, disponible: ${formatCents(available)}`
    );
  }
}

export type CustomerCreditProfile = {
  rating: ReturnType<typeof computeCreditRating>["rating"];
  ratingLabel: string;
  onTimePercent: number;
  outstandingCents: number;
  limitCents: number | null;
  availableCents: number | null;
};

export async function getCustomerCreditProfile(
  customerId: string
): Promise<CustomerCreditProfile | null> {
  await requireSalesWrite();

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return null;

  const [outstandingCents, plans] = await Promise.all([
    getCustomerOutstandingCents(customerId),
    prisma.creditPlan.findMany({
      where: {
        customerId,
        status: { in: [CreditPlanStatus.ACTIVE, CreditPlanStatus.PAID] },
      },
      include: {
        installments: {
          include: { payments: { orderBy: { paidAt: "desc" } } },
        },
      },
    }),
  ]);

  const installments = plans.flatMap((p) => p.installments);
  const { rating, onTimePercent, label } = computeCreditRating(installments);
  const limitCents = customer.creditLimitCents;
  const availableCents =
    limitCents != null ? Math.max(0, limitCents - outstandingCents) : null;

  return {
    rating,
    ratingLabel: label,
    onTimePercent,
    outstandingCents,
    limitCents,
    availableCents,
  };
}

export type CreditDashboardData = {
  summary: CreditReportData["summary"];
  agingBuckets: CreditReportData["agingBuckets"];
  overdueInstallments: CreditReportData["overdueInstallments"];
  upcomingInstallments: CreditReportData["upcomingInstallments"];
  recentPayments: CreditReportData["paymentsInPeriod"];
  topCustomers: CreditReportData["byCustomer"];
};

export async function getCreditDashboard(): Promise<CreditDashboardData> {
  await requireSalesWrite();
  await syncOverdueInstallments();

  const { start, end } = defaultDateRangeDays(30);

  const [report, recentPayments, activePlans] = await Promise.all([
    loadCreditReportData(start, end),
    prisma.creditPayment.findMany({
      take: 10,
      orderBy: { paidAt: "desc" },
      include: {
        user: { select: { name: true } },
        installment: {
          include: {
            creditPlan: { include: { customer: true } },
          },
        },
      },
    }),
    prisma.creditPlan.findMany({
      where: { status: CreditPlanStatus.ACTIVE },
      include: { customer: true, installments: true },
    }),
  ]);

  const upcomingInstallments = collectUpcomingInstallments(activePlans, new Date(), 7);

  return {
    summary: report.summary,
    agingBuckets: report.agingBuckets,
    overdueInstallments: report.overdueInstallments.slice(0, 10),
    upcomingInstallments: upcomingInstallments.slice(0, 10),
    recentPayments: recentPayments.map((p) => ({
      paidAt: p.paidAt,
      planNumber: p.installment.creditPlan.planNumber,
      customerName: p.installment.creditPlan.customer.name,
      installmentNumber: p.installment.number,
      amountCents: p.amountCents,
      paymentMethod: p.paymentMethod,
      userName: p.user.name,
    })),
    topCustomers: report.byCustomer.slice(0, 10),
  };
}

export async function getCreditOperationalReport(
  startDate: string,
  endDate: string
): Promise<CreditReportData> {
  await requireSalesWrite();
  await syncOverdueInstallments();
  return loadCreditReportData(startDate, endDate);
}

/** Recompute OVERDUE status for listing (no cron in v1). */
export async function syncOverdueInstallments() {
  const now = new Date();
  const pending = await prisma.creditInstallment.findMany({
    where: {
      status: { in: ["PENDING", "PARTIAL"] },
      dueDate: { lt: now },
      creditPlan: { status: CreditPlanStatus.ACTIVE },
    },
  });

  for (const inst of pending) {
    const status = installmentStatusFromPaid(inst.amountCents, inst.paidCents, inst.dueDate, now);
    if (status === "OVERDUE") {
      await prisma.creditInstallment.update({
        where: { id: inst.id },
        data: { status: "OVERDUE" },
      });
    }
  }
}
