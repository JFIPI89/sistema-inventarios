"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canWriteSales } from "@/lib/permissions";
import { PaymentMethod, SaleStatus, SaleType, StockMovementType, CreditPeriodUnit, CreditPlanStatus, Role } from "@prisma/client";
import { buildChanges, logAudit } from "@/lib/audit";
import { assertCreditLimit, createCreditPlanInTx } from "@/actions/credit";
import { toCents } from "@/lib/money";
import { formatMoney } from "@/lib/currency";
import {
  addAppCalendarDays,
  parseAppDate,
  startOfAppDay,
  startOfZonedDay,
  toDateKey,
} from "@/lib/timezone";

async function requireSalesWrite() {
  const session = await getSession();
  if (!session || !canWriteSales(session.role)) {
    throw new Error("No autorizado");
  }
  return session;
}

export async function getCustomers(search?: string) {
  return prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
  });
}

export async function getCustomer(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        orderBy: { saleDate: "desc" },
        take: 10,
        include: { items: { include: { product: true } } },
      },
    },
  });
}

export async function createCustomer(formData: FormData) {
  const session = await getSession();
  if (!session || !canWriteSales(session.role)) return { error: "No autorizado" };

  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (!code || !name) return { error: "Código y nombre son requeridos" };

  const customer = await prisma.customer.create({
    data: {
      code,
      name,
      email: String(formData.get("email") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      taxId: String(formData.get("taxId") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
    },
  });

  await logAudit({
    session,
    action: "CREATE",
    entityType: "Customer",
    entityId: customer.id,
    entityLabel: code,
    summary: `Alta de cliente ${code} — ${name}`,
  });

  revalidatePath("/customers");
  return { success: true };
}

export async function updateCustomer(id: string, formData: FormData) {
  const session = await getSession();
  if (!session || !canWriteSales(session.role)) return { error: "No autorizado" };

  const before = await prisma.customer.findUnique({ where: { id } });
  if (!before) return { error: "Cliente no encontrado" };

  const afterData = {
    code: String(formData.get("code") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    taxId: String(formData.get("taxId") || "").trim() || null,
    address: String(formData.get("address") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
    isActive: formData.get("isActive") === "on",
  };

  const updateData: typeof afterData & { creditLimitCents?: number | null } = { ...afterData };

  if (session.role === Role.ADMIN) {
    const limitRaw = String(formData.get("creditLimit") || "").trim();
    updateData.creditLimitCents =
      limitRaw === "" ? null : toCents(parseFloat(limitRaw.replace(",", ".")));
    if (limitRaw !== "" && (Number.isNaN(updateData.creditLimitCents!) || updateData.creditLimitCents! < 0)) {
      return { error: "Tope de crédito inválido" };
    }
  }

  await prisma.customer.update({ where: { id }, data: updateData });

  await logAudit({
    session,
    action: "UPDATE",
    entityType: "Customer",
    entityId: id,
    entityLabel: afterData.code,
    summary: `Modificó cliente ${afterData.code}`,
    changes: buildChanges(
      { code: before.code, name: before.name, isActive: before.isActive },
      { code: afterData.code, name: afterData.name, isActive: afterData.isActive }
    ),
  });

  revalidatePath("/customers");
  return { success: true };
}

export type CartItem = {
  productId: string;
  lotId: string;
  productName: string;
  lotNumber: string;
  quantity: number;
  unitPrice: number;
};

export async function searchProductsForSale(query: string) {
  const q = query.trim();
  if (!q) return [];

  return prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { sku: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q, mode: "insensitive" } },
        { gtin: { contains: q, mode: "insensitive" } },
      ],
    },
    include: {
      lots: {
        where: { quantity: { gt: 0 } },
        orderBy: [{ expirationDate: "asc" }, { createdAt: "asc" }],
      },
    },
    take: 20,
  });
}

async function generateSaleNumber() {
  const count = await prisma.sale.count();
  const date = new Date();
  const prefix = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  return `V-${prefix}-${String(count + 1).padStart(5, "0")}`;
}

export async function createSale(data: {
  customerId?: string;
  saleType: SaleType;
  paymentMethod: PaymentMethod;
  discount: number;
  items: CartItem[];
  installmentCount?: number;
  periodUnit?: CreditPeriodUnit;
  startDate?: string;
}) {
  const session = await requireSalesWrite();

  if (!data.items.length) return { error: "El carrito está vacío" };

  if (data.saleType === SaleType.CREDITO) {
    if (!data.customerId) return { error: "Seleccione un cliente para venta a crédito" };
    if (!data.installmentCount || data.installmentCount < 1 || data.installmentCount > 52) {
      return { error: "Indique cantidad de cuotas (1–52)" };
    }
    if (!data.periodUnit) return { error: "Indique semanas o meses" };
    if (!data.startDate) return { error: "Indique fecha de primera cuota" };
  }

  const saleNumber = await generateSaleNumber();
  const discount = data.discount || 0;
  const creditStartDate = data.startDate ? parseAppDate(data.startDate) : startOfAppDay();

  if (data.saleType === SaleType.CREDITO && Number.isNaN(creditStartDate.getTime())) {
    return { error: "Fecha de primera cuota inválida" };
  }

  let creditPlanNumber: string | undefined;
  let auditedTotal = 0;
  let auditedItems: Array<{
    product: string;
    lot: string;
    qty: number;
    price: number;
  }> = [];

  try {
    await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const pricedItems: Array<{
        productId: string;
        lotId: string;
        productName: string;
        lotNumber: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        lotQty: number;
      }> = [];

      for (const item of data.items) {
        const [lot, product] = await Promise.all([
          tx.lot.findUnique({ where: { id: item.lotId } }),
          tx.product.findUnique({ where: { id: item.productId } }),
        ]);

        if (!lot || !product) {
          throw new Error(`Producto o lote no encontrado (${item.productName})`);
        }
        if (lot.productId !== item.productId) {
          throw new Error(`El lote ${item.lotNumber} no corresponde al producto seleccionado`);
        }
        if (lot.quantity < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.name} / ${lot.lotNumber}`);
        }
        if (product.salePrice <= 0) {
          throw new Error(`El producto ${product.name} no tiene precio de venta válido`);
        }

        const unitPrice = product.salePrice;
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;
        pricedItems.push({
          productId: product.id,
          lotId: lot.id,
          productName: product.name,
          lotNumber: lot.lotNumber,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
          lotQty: lot.quantity,
        });
      }

      const total = Math.max(0, subtotal - discount);
      if (total <= 0) {
        throw new Error("El total debe ser mayor a cero");
      }
      const totalCents = toCents(total);
      auditedTotal = total;
      auditedItems = pricedItems.map((i) => ({
        product: i.productName,
        lot: i.lotNumber,
        qty: i.quantity,
        price: i.unitPrice,
      }));

      if (data.saleType === SaleType.CREDITO && data.customerId) {
        await assertCreditLimit(data.customerId, totalCents, tx);
      }

      const sale = await tx.sale.create({
        data: {
          saleNumber,
          customerId: data.customerId || null,
          userId: session.id,
          subtotal,
          discount,
          total,
          saleType: data.saleType,
          paymentMethod:
            data.saleType === SaleType.CREDITO ? PaymentMethod.OTHER : data.paymentMethod,
          status: SaleStatus.COMPLETED,
        },
      });

      for (const item of pricedItems) {
        await tx.lot.update({
          where: { id: item.lotId },
          data: { quantity: item.lotQty - item.quantity },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            lotId: item.lotId,
            type: StockMovementType.OUT,
            quantity: -item.quantity,
            reference: saleNumber,
          },
        });

        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            lotId: item.lotId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          },
        });
      }

      if (data.saleType === SaleType.CREDITO && data.customerId) {
        const plan = await createCreditPlanInTx(tx, {
          customerId: data.customerId,
          totalCents,
          installmentCount: data.installmentCount!,
          periodUnit: data.periodUnit!,
          startDate: creditStartDate,
          saleId: sale.id,
          createdById: session.id,
        });
        creditPlanNumber = plan.planNumber;
      }
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al registrar venta" };
  }

  const saleRecord = await prisma.sale.findUnique({
    where: { saleNumber },
    include: { creditPlan: true },
  });

  await logAudit({
    session,
    action: "CREATE",
    entityType: "Sale",
    entityId: saleRecord?.id,
    entityLabel: saleNumber,
    summary:
      data.saleType === SaleType.CREDITO
        ? `Venta a crédito ${saleNumber} por ${formatMoney(auditedTotal)} — plan ${creditPlanNumber}`
        : `Venta ${saleNumber} por ${formatMoney(auditedTotal)} (${data.items.length} ítems)`,
    changes: {
      items: auditedItems,
      discount,
      saleType: data.saleType,
      paymentMethod: data.paymentMethod,
      creditPlanNumber,
    },
  });

  revalidatePath("/sales");
  revalidatePath("/credit");
  revalidatePath("/lots");
  revalidatePath("/");
  revalidatePath("/reports");
  if (data.customerId) revalidatePath(`/customers/${data.customerId}`);
  return { success: true, saleNumber, creditPlanNumber };
}

export async function getSales(search?: string) {
  return prisma.sale.findMany({
    where: search
      ? {
          OR: [
            { saleNumber: { contains: search, mode: "insensitive" } },
            { customer: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: {
      customer: true,
      user: { select: { name: true } },
      items: { include: { product: true, lot: true } },
      creditPlan: { select: { id: true, planNumber: true } },
    },
    orderBy: { saleDate: "desc" },
    take: 100,
  });
}

export async function getSale(id: string) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      user: { select: { name: true, email: true } },
      items: { include: { product: true, lot: true } },
      creditPlan: { select: { id: true, planNumber: true, status: true } },
    },
  });
}

export async function cancelSale(id: string) {
  const session = await requireSalesWrite();

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      items: true,
      creditPlan: {
        include: {
          installments: { include: { payments: true } },
        },
      },
    },
  });

  if (!sale || sale.status === SaleStatus.CANCELLED) {
    return { error: "Venta no encontrada o ya cancelada" };
  }

  if (sale.creditPlan) {
    const hasPayments = sale.creditPlan.installments.some(
      (inst) => inst.payments.length > 0 || inst.paidCents > 0
    );
    if (hasPayments) {
      return {
        error:
          "No se puede cancelar la venta: el plan de crédito tiene abonos registrados. Anule los abonos o cancele el plan desde Cartera.",
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      await tx.lot.update({
        where: { id: item.lotId },
        data: { quantity: { increment: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          lotId: item.lotId,
          type: StockMovementType.IN,
          quantity: item.quantity,
          reference: `Anulación ${sale.saleNumber}`,
        },
      });
    }
    await tx.sale.update({
      where: { id },
      data: { status: SaleStatus.CANCELLED },
    });
    if (sale.creditPlan) {
      await tx.creditPlan.update({
        where: { id: sale.creditPlan.id },
        data: { status: CreditPlanStatus.CANCELLED },
      });
    }
  });

  await logAudit({
    session,
    action: "CANCEL",
    entityType: "Sale",
    entityId: id,
    entityLabel: sale.saleNumber,
    summary: sale.creditPlan
      ? `Canceló venta ${sale.saleNumber} (stock restaurado, cartera ${sale.creditPlan.planNumber} cancelada)`
      : `Canceló venta ${sale.saleNumber} (stock restaurado)`,
    changes: {
      items: sale.items.map((i) => ({ productId: i.productId, lotId: i.lotId, qty: i.quantity })),
      creditPlanNumber: sale.creditPlan?.planNumber,
    },
  });

  revalidatePath("/sales");
  revalidatePath("/lots");
  revalidatePath("/credit");
  if (sale.customerId) revalidatePath(`/customers/${sale.customerId}`);
  if (sale.creditPlan) revalidatePath(`/credit/${sale.creditPlan.id}`);
  return { success: true };
}

export async function getCreditPortfolioSnapshot() {
  const session = await getSession();
  if (!session || !canWriteSales(session.role)) {
    return { activePlans: 0, totalOutstandingCents: 0 };
  }

  const activePlans = await prisma.creditPlan.count({
    where: { status: "ACTIVE" },
  });
  if (activePlans === 0) {
    return { activePlans: 0, totalOutstandingCents: 0 };
  }

  const plans = await prisma.creditPlan.findMany({
    where: { status: "ACTIVE" },
    include: { installments: true },
  });

  let totalOutstandingCents = 0;
  for (const plan of plans) {
    for (const inst of plan.installments) {
      totalOutstandingCents += Math.max(0, inst.amountCents - inst.paidCents);
    }
  }

  return { activePlans, totalOutstandingCents };
}

export async function getDashboardStats() {
  const today = startOfAppDay();
  const tomorrow = startOfZonedDay(addAppCalendarDays(toDateKey(today), 1));

  const [todaySales, totalProducts, lowStock, expiringLots] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        saleDate: { gte: today, lt: tomorrow },
        status: SaleStatus.COMPLETED,
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { lots: { select: { quantity: true } } },
    }),
    prisma.lot.count({
      where: {
        expirationDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
        quantity: { gt: 0 },
      },
    }),
  ]);

  const lowStockCount = lowStock.filter((p) => {
    const total = p.lots.reduce((s, l) => s + l.quantity, 0);
    return total <= p.minStock;
  }).length;

  return {
    todayTotal: todaySales._sum.total || 0,
    todayCount: todaySales._count,
    totalProducts,
    lowStockCount,
    expiringLots,
  };
}
