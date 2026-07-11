"use server";

import { prisma } from "@/lib/db";
import { SaleStatus } from "@prisma/client";

export type SuggestItem = {
  id: string;
  title: string;
  subtitle?: string;
};

export async function suggestProducts(query: string): Promise<SuggestItem[]> {
  const q = query.trim();
  if (!q) return [];
  const rows = await prisma.product.findMany({
    where: {
      OR: [
        { sku: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { gtin: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, sku: true, name: true, brand: true },
    orderBy: { name: "asc" },
    take: 8,
  });
  return rows.map((p) => ({
    id: p.id,
    title: p.name,
    subtitle: [p.sku, p.brand].filter(Boolean).join(" · "),
  }));
}

export async function suggestCustomers(query: string): Promise<SuggestItem[]> {
  const q = query.trim();
  if (!q) return [];
  const rows = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
    take: 8,
  });
  return rows.map((c) => ({
    id: c.id,
    title: c.name,
    subtitle: c.code,
  }));
}

export async function suggestLots(query: string): Promise<SuggestItem[]> {
  const q = query.trim();
  if (!q) return [];
  const rows = await prisma.lot.findMany({
    where: {
      OR: [
        { lotNumber: { contains: q, mode: "insensitive" } },
        { product: { name: { contains: q, mode: "insensitive" } } },
        { product: { sku: { contains: q, mode: "insensitive" } } },
      ],
    },
    select: {
      id: true,
      lotNumber: true,
      quantity: true,
      product: { select: { sku: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  return rows.map((l) => ({
    id: l.id,
    title: l.lotNumber,
    subtitle: `${l.product.sku} — ${l.product.name} · qty ${l.quantity}`,
  }));
}

export async function suggestSales(query: string): Promise<SuggestItem[]> {
  const q = query.trim();
  if (!q) return [];
  const rows = await prisma.sale.findMany({
    where: {
      OR: [
        { saleNumber: { contains: q, mode: "insensitive" } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    select: {
      id: true,
      saleNumber: true,
      status: true,
      customer: { select: { name: true } },
    },
    orderBy: { saleDate: "desc" },
    take: 8,
  });
  return rows.map((s) => ({
    id: s.id,
    title: s.saleNumber,
    subtitle: [s.customer?.name, s.status === SaleStatus.CANCELLED ? "Anulada" : null]
      .filter(Boolean)
      .join(" · "),
  }));
}

export async function suggestCreditPlans(query: string): Promise<SuggestItem[]> {
  const q = query.trim();
  if (!q) return [];
  const rows = await prisma.creditPlan.findMany({
    where: {
      OR: [
        { planNumber: { contains: q, mode: "insensitive" } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
        { customer: { code: { contains: q, mode: "insensitive" } } },
      ],
    },
    select: {
      id: true,
      planNumber: true,
      status: true,
      customer: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  return rows.map((p) => ({
    id: p.id,
    title: p.planNumber,
    subtitle: `${p.customer.code} — ${p.customer.name} · ${p.status}`,
  }));
}

export async function suggestSuppliers(query: string): Promise<SuggestItem[]> {
  const q = query.trim();
  if (!q) return [];
  const rows = await prisma.supplier.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 8,
  });
  return rows.map((s) => ({ id: s.id, title: s.name }));
}

export async function suggestCategories(query: string): Promise<SuggestItem[]> {
  const q = query.trim();
  if (!q) return [];
  const rows = await prisma.category.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    select: { id: true, name: true, parent: { select: { name: true } } },
    orderBy: { name: "asc" },
    take: 8,
  });
  return rows.map((c) => ({
    id: c.id,
    title: c.name,
    subtitle: c.parent?.name ? `Padre: ${c.parent.name}` : undefined,
  }));
}

export async function suggestStockMovements(query: string): Promise<SuggestItem[]> {
  const q = query.trim();
  if (!q) return [];
  const rows = await prisma.stockMovement.findMany({
    where: {
      OR: [
        { reference: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        { product: { sku: { contains: q, mode: "insensitive" } } },
        { product: { name: { contains: q, mode: "insensitive" } } },
        { lot: { lotNumber: { contains: q, mode: "insensitive" } } },
      ],
    },
    select: {
      id: true,
      reference: true,
      type: true,
      product: { select: { sku: true, name: true } },
      lot: { select: { lotNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  return rows.map((m) => ({
    id: m.id,
    title: m.product.name,
    subtitle: [m.product.sku, m.lot?.lotNumber, m.reference, m.type].filter(Boolean).join(" · "),
  }));
}

export async function suggestAuditLogs(query: string): Promise<SuggestItem[]> {
  const q = query.trim();
  if (!q) return [];
  const rows = await prisma.auditLog.findMany({
    where: {
      OR: [
        { summary: { contains: q, mode: "insensitive" } },
        { entityLabel: { contains: q, mode: "insensitive" } },
        { userName: { contains: q, mode: "insensitive" } },
        { userEmail: { contains: q, mode: "insensitive" } },
        { entityType: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      summary: true,
      entityLabel: true,
      userName: true,
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  return rows.map((l) => ({
    id: l.id,
    title: l.summary,
    subtitle: [l.entityLabel, l.userName].filter(Boolean).join(" · "),
  }));
}
