"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canViewReports, canWriteSales } from "@/lib/permissions";
import type { ReportSection } from "@/lib/reports/sections";
import { SaleStatus } from "@prisma/client";
import { syncOverdueInstallments } from "@/actions/credit";
import { fromCents } from "@/lib/money";
import { loadCreditReportData, type CreditReportData } from "@/lib/credit-report";
import {
  formatDateKey,
  formatDateTimeIso,
  parseAppDateRange,
  toDateKey,
} from "@/lib/timezone";

function csvCell(value: string | number | null | undefined): string {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(values: (string | number | null | undefined)[]): string {
  return values.map(csvCell).join(",");
}

async function requireReports() {
  const session = await getSession();
  if (!session || !canViewReports(session.role)) {
    throw new Error("No autorizado");
  }
  return session;
}

async function requireReportsOrCreditExport(sections: ReportSection[]) {
  const session = await getSession();
  if (!session) throw new Error("No autorizado");
  const creditOnly = sections.length === 1 && sections[0] === "credit";
  if (creditOnly && canWriteSales(session.role)) return session;
  if (!canViewReports(session.role)) throw new Error("No autorizado");
  return session;
}

export async function getSalesByPeriod(startDate: string, endDate: string) {
  await requireReports();

  const { start, end } = parseAppDateRange(startDate, endDate);

  const sales = await prisma.sale.findMany({
    where: {
      saleDate: { gte: start, lte: end },
      status: SaleStatus.COMPLETED,
    },
    orderBy: { saleDate: "asc" },
  });

  const byDay: Record<string, { date: string; total: number; count: number }> = {};
  for (const sale of sales) {
    const key = toDateKey(sale.saleDate);
    if (!byDay[key]) byDay[key] = { date: key, total: 0, count: 0 };
    byDay[key].total += sale.total;
    byDay[key].count += 1;
  }

  return {
    sales,
    chartData: Object.values(byDay),
    summary: {
      total: sales.reduce((s, x) => s + x.total, 0),
      count: sales.length,
    },
  };
}

export async function getSalesByProduct(startDate: string, endDate: string) {
  await requireReports();

  const { start, end } = parseAppDateRange(startDate, endDate);

  const items = await prisma.saleItem.findMany({
    where: {
      sale: {
        saleDate: { gte: start, lte: end },
        status: SaleStatus.COMPLETED,
      },
    },
    include: { product: true },
  });

  const map: Record<string, { name: string; sku: string; units: number; revenue: number }> = {};
  for (const item of items) {
    const key = item.productId;
    if (!map[key]) {
      map[key] = {
        name: item.product.name,
        sku: item.product.sku,
        units: 0,
        revenue: 0,
      };
    }
    map[key].units += item.quantity;
    map[key].revenue += item.lineTotal;
  }

  return Object.values(map).sort((a, b) => b.revenue - a.revenue);
}

export async function getSalesByCustomer(startDate: string, endDate: string) {
  await requireReports();

  const { start, end } = parseAppDateRange(startDate, endDate);

  const sales = await prisma.sale.findMany({
    where: {
      saleDate: { gte: start, lte: end },
      status: SaleStatus.COMPLETED,
      customerId: { not: null },
    },
    include: { customer: true },
  });

  const map: Record<string, { name: string; code: string; count: number; total: number }> = {};
  for (const sale of sales) {
    if (!sale.customer) continue;
    const key = sale.customerId!;
    if (!map[key]) {
      map[key] = {
        name: sale.customer.name,
        code: sale.customer.code,
        count: 0,
        total: 0,
      };
    }
    map[key].count += 1;
    map[key].total += sale.total;
  }

  return Object.values(map).sort((a, b) => b.total - a.total);
}

export type CreditReport = CreditReportData;

export async function getCreditReport(startDate: string, endDate: string): Promise<CreditReport> {
  await requireReports();
  await syncOverdueInstallments();
  return loadCreditReportData(startDate, endDate);
}

export async function getInventoryValuation() {
  await requireReports();

  const lots = await prisma.lot.findMany({
    where: { quantity: { gt: 0 } },
    include: { product: true },
  });

  return lots.map((lot) => ({
    productName: lot.product.name,
    sku: lot.product.sku,
    brand: lot.product.brand,
    lotNumber: lot.lotNumber,
    quantity: lot.quantity,
    costPrice: lot.product.costPrice,
    value: lot.quantity * lot.product.costPrice,
    expirationDate: lot.expirationDate,
  }));
}

export async function getSalesProfitReport(startDate: string, endDate: string) {
  await requireReports();

  const { start, end } = parseAppDateRange(startDate, endDate);

  const sales = await prisma.sale.findMany({
    where: {
      saleDate: { gte: start, lte: end },
      status: SaleStatus.COMPLETED,
    },
    include: {
      items: { include: { product: true } },
    },
    orderBy: { saleDate: "asc" },
  });

  let totalRevenue = 0;
  let totalCost = 0;
  let totalDiscount = 0;

  const byDay: Record<
    string,
    { date: string; revenue: number; cost: number; utility: number; count: number }
  > = {};
  const byProduct: Record<
    string,
    {
      name: string;
      sku: string;
      units: number;
      revenue: number;
      cost: number;
      utility: number;
    }
  > = {};

  for (const sale of sales) {
    let saleCost = 0;
    for (const item of sale.items) {
      const itemCost = item.product.costPrice * item.quantity;
      saleCost += itemCost;

      const key = item.productId;
      if (!byProduct[key]) {
        byProduct[key] = {
          name: item.product.name,
          sku: item.product.sku,
          units: 0,
          revenue: 0,
          cost: 0,
          utility: 0,
        };
      }
      byProduct[key].units += item.quantity;
      byProduct[key].revenue += item.lineTotal;
      byProduct[key].cost += itemCost;
      byProduct[key].utility += item.lineTotal - itemCost;
    }

    const saleUtility = sale.total - saleCost;
    totalRevenue += sale.total;
    totalCost += saleCost;
    totalDiscount += sale.discount;

    const dayKey = toDateKey(sale.saleDate);
    if (!byDay[dayKey]) {
      byDay[dayKey] = { date: dayKey, revenue: 0, cost: 0, utility: 0, count: 0 };
    }
    byDay[dayKey].revenue += sale.total;
    byDay[dayKey].cost += saleCost;
    byDay[dayKey].utility += saleUtility;
    byDay[dayKey].count += 1;
  }

  const totalUtility = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? (totalUtility / totalRevenue) * 100 : 0;

  return {
    summary: {
      totalRevenue,
      totalCost,
      totalDiscount,
      totalUtility,
      marginPercent,
      salesCount: sales.length,
    },
    chartData: Object.values(byDay),
    byProduct: Object.values(byProduct).sort((a, b) => b.utility - a.utility),
  };
}

export async function exportReportCsv(
  startDate: string,
  endDate: string,
  sections: ReportSection[]
) {
  await requireReportsOrCreditExport(sections);

  const blocks: string[] = [];

  if (sections.includes("sales")) {
    const { sales, summary } = await getSalesByPeriod(startDate, endDate);
    const rows = sales.map((s) =>
      csvRow([
        s.saleNumber,
        formatDateTimeIso(s.saleDate),
        "",
        s.subtotal,
        s.discount,
        s.total,
        s.status,
      ])
    );
    blocks.push(
      `=== Ventas del periodo (${startDate} — ${endDate}) ===`,
      "Numero,Fecha,Cliente,Subtotal,Descuento,Total,Estado",
      ...rows,
      "",
      csvRow(["Total ventas", "", "", "", "", summary.total, `${summary.count} transacciones`])
    );
  }

  if (sections.includes("products")) {
    const products = await getSalesByProduct(startDate, endDate);
    const rows = products.map((p) =>
      csvRow([p.name, p.sku, p.units, p.revenue])
    );
    blocks.push(
      `=== Top productos (${startDate} — ${endDate}) ===`,
      "Producto,SKU,Unidades,Ingresos",
      ...rows
    );
  }

  if (sections.includes("customers")) {
    const customers = await getSalesByCustomer(startDate, endDate);
    const rows = customers.map((c) =>
      csvRow([c.name, c.code, c.count, c.total])
    );
    blocks.push(
      `=== Top clientes (${startDate} — ${endDate}) ===`,
      "Cliente,Codigo,Compras,Total",
      ...rows
    );
  }

  if (sections.includes("profit")) {
    const profit = await getSalesProfitReport(startDate, endDate);
    const rows = profit.byProduct.map((p) =>
      csvRow([p.name, p.sku, p.units, p.revenue, p.cost, p.utility])
    );
    blocks.push(
      `=== Utilidades (${startDate} — ${endDate}) ===`,
      "Producto,SKU,Unidades,Ingresos,Costo,Utilidad",
      ...rows,
      "",
      "Resumen,,,,,",
      csvRow(["Ingresos netos", "", "", "", "", profit.summary.totalRevenue]),
      csvRow(["Costo total", "", "", "", "", profit.summary.totalCost]),
      csvRow(["Utilidad", "", "", "", "", profit.summary.totalUtility]),
      csvRow(["Margen %", "", "", "", "", profit.summary.marginPercent.toFixed(2)])
    );
  }

  if (sections.includes("inventory")) {
    const inventory = await getInventoryValuation();
    const total = inventory.reduce((s, r) => s + r.value, 0);
    const rows = inventory.map((i) =>
      csvRow([
        i.productName,
        i.sku,
        i.brand ?? "",
        i.lotNumber,
        i.quantity,
        i.costPrice,
        i.value,
        i.expirationDate ? formatDateKey(i.expirationDate) : "",
      ])
    );
    blocks.push(
      "=== Inventario valorizado (snapshot) ===",
      "Producto,SKU,Marca,Lote,Cantidad,Costo unitario,Valor,Vencimiento",
      ...rows,
      "",
      csvRow(["Total inventario", "", "", "", "", "", total])
    );
  }

  if (sections.includes("credit")) {
    await syncOverdueInstallments();
    const credit = await loadCreditReportData(startDate, endDate);
    const s = credit.summary;
    const aging = credit.agingBuckets;
    blocks.push(
      `=== Cartera / Crédito (${startDate} — ${endDate}) — montos en MXN ===`,
      "Resumen,Valor",
      csvRow(["Planes activos", s.activePlans]),
      csvRow(["Cartera activa total (MXN)", fromCents(s.totalPortfolioCents)]),
      csvRow(["Saldo pendiente snapshot (MXN)", fromCents(s.totalOutstandingCents)]),
      csvRow(["Cobrado acumulado planes activos (MXN)", fromCents(s.totalCollectedCents)]),
      csvRow(["Tasa de recuperación %", s.collectionRatePercent]),
      csvRow(["Cobrado en período (MXN)", fromCents(s.collectedInPeriodCents)]),
      csvRow(["Abonos en período", s.paymentsInPeriodCount]),
      csvRow(["Cuotas vencidas", s.overdueInstallmentsCount]),
      csvRow(["Monto vencido (MXN)", fromCents(s.overdueAmountCents)]),
      csvRow(["Por cobrar próximos 7 días (MXN)", fromCents(s.dueNext7Cents)]),
      csvRow(["Por cobrar próximos 30 días (MXN)", fromCents(s.dueNext30Cents)]),
      csvRow(["Nuevos planes en período", s.newPlansInPeriod]),
      csvRow(["Monto nuevos planes (MXN)", fromCents(s.newPlansAmountCents)]),
      "",
      "=== Antigüedad de saldos (MXN) ===",
      "Bucket,Monto",
      csvRow(["Al día", fromCents(aging.alDia)]),
      csvRow(["Vencido 1-7 días", fromCents(aging.vencido_1_7)]),
      csvRow(["Vencido 8-30 días", fromCents(aging.vencido_8_30)]),
      csvRow(["Vencido 31-60 días", fromCents(aging.vencido_31_60)]),
      csvRow(["Vencido más de 60 días", fromCents(aging.vencido_60_plus)]),
      "",
      "=== Calificación por cliente (activos) ===",
      "Cliente,Codigo,Calificacion,% puntual,Tope MXN,Usado MXN,Disponible MXN,Planes,Saldo pendiente,Vencido",
      ...credit.byCustomer.map((c) =>
        csvRow([
          c.name,
          c.code,
          c.rating ?? "N/A",
          c.onTimePercent,
          c.creditLimitCents != null ? fromCents(c.creditLimitCents) : "",
          fromCents(c.outstandingCents),
          c.availableCents != null ? fromCents(c.availableCents) : "",
          c.activePlans,
          fromCents(c.outstandingCents),
          fromCents(c.overdueCents),
        ])
      ),
      "",
      "=== Cuotas vencidas ===",
      "Plan,Cliente,Cuota,Vencimiento,Monto,Abonado,Saldo",
      ...credit.overdueInstallments.map((i) =>
        csvRow([
          i.planNumber,
          i.customerName,
          i.installmentNumber,
          formatDateKey(i.dueDate),
          fromCents(i.amountCents),
          fromCents(i.paidCents),
          fromCents(i.remainingCents),
        ])
      ),
      "",
      "=== Cuotas por vencer en período ===",
      "Plan,Cliente,Cuota,Vencimiento,Saldo",
      ...credit.upcomingInstallments.map((i) =>
        csvRow([
          i.planNumber,
          i.customerName,
          i.installmentNumber,
          formatDateKey(i.dueDate),
          fromCents(i.remainingCents),
        ])
      ),
      "",
      `=== Abonos del período (${startDate} — ${endDate}) ===`,
      "Fecha,Plan,Cliente,Cuota,Monto MXN,Metodo,Usuario",
      ...credit.paymentsInPeriod.map((p) =>
        csvRow([
          formatDateTimeIso(p.paidAt),
          p.planNumber,
          p.customerName,
          p.installmentNumber,
          fromCents(p.amountCents),
          p.paymentMethod,
          p.userName,
        ])
      )
    );
  }

  return blocks.join("\n");
}
