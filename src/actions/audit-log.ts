"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Role, AuditAction, Prisma } from "@prisma/client";
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS } from "@/lib/audit";
import { parseAppDateRange, startOfZonedDay, endOfZonedDay } from "@/lib/timezone";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    throw new Error("No autorizado");
  }
  return session;
}

export async function getAuditLogs(filters: {
  search?: string;
  entityType?: string;
  action?: AuditAction;
  dateFrom?: string;
  dateTo?: string;
}) {
  await requireAdmin();

  const where: Prisma.AuditLogWhereInput = {};

  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.action) where.action = filters.action;

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
      { summary: { contains: filters.search, mode: "insensitive" } },
      { entityLabel: { contains: filters.search, mode: "insensitive" } },
      { userName: { contains: filters.search, mode: "insensitive" } },
      { userEmail: { contains: filters.search, mode: "insensitive" } },
      { entityType: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return logs.map((log) => ({
    ...log,
    actionLabel: AUDIT_ACTION_LABELS[log.action],
    entityTypeLabel: AUDIT_ENTITY_LABELS[log.entityType] ?? log.entityType,
  }));
}
