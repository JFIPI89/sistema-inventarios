"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canWriteProducts } from "@/lib/permissions";
import { Prisma, StockMovementType } from "@prisma/client";
import { parseAppDateRange, startOfZonedDay, endOfZonedDay } from "@/lib/timezone";

async function requireStockRead() {
  const session = await getSession();
  if (!session || !canWriteProducts(session.role)) {
    throw new Error("No autorizado");
  }
}

const TYPE_LABELS: Record<StockMovementType, string> = {
  IN: "Entrada",
  OUT: "Salida",
  ADJUST: "Ajuste",
};

export async function getStockMovements(filters: {
  search?: string;
  productId?: string;
  lotId?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: StockMovementType;
}) {
  await requireStockRead();

  const where: Prisma.StockMovementWhereInput = {};

  if (filters.productId) where.productId = filters.productId;
  if (filters.lotId) where.lotId = filters.lotId;
  if (filters.type) where.type = filters.type;

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom && filters.dateTo) {
      const range = parseAppDateRange(filters.dateFrom, filters.dateTo);
      where.createdAt.gte = range.start;
      where.createdAt.lte = range.end;
    } else if (filters.dateFrom) {
      where.createdAt.gte = startOfZonedDay(filters.dateFrom);
    } else if (filters.dateTo) {
      where.createdAt.lte = endOfZonedDay(filters.dateTo);
    }
  }

  if (filters.search) {
    where.OR = [
      { reference: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
      { product: { sku: { contains: filters.search, mode: "insensitive" } } },
      { product: { name: { contains: filters.search, mode: "insensitive" } } },
      { lot: { lotNumber: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      product: { select: { sku: true, name: true } },
      lot: { select: { lotNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return movements.map((m) => ({
    ...m,
    typeLabel: TYPE_LABELS[m.type],
  }));
}
