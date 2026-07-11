"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canWriteProducts } from "@/lib/permissions";
import { validateGtin, validateLotNumber, normalizeGtin } from "@/lib/gs1";
import { StockMovementType } from "@prisma/client";
import { buildChanges, logAudit } from "@/lib/audit";
import { parseAppDate } from "@/lib/timezone";

async function requireProductWrite() {
  const session = await getSession();
  if (!session || !canWriteProducts(session.role)) {
    throw new Error("No autorizado");
  }
  return session;
}

export async function getProducts(search?: string) {
  return prisma.product.findMany({
    where: search
      ? {
          OR: [
            { sku: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
            { gtin: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      category: true,
      lots: { select: { quantity: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { category: true, lots: true },
  });
}

export async function createProduct(formData: FormData) {
  const session = await requireProductWrite();

  const sku = String(formData.get("sku") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const gtinRaw = String(formData.get("gtin") || "").trim();
  const gtin = gtinRaw ? normalizeGtin(gtinRaw) : null;

  if (!sku || !name) return { error: "SKU y nombre son requeridos" };
  if (gtin && !validateGtin(gtin)) return { error: "GTIN inválido (AI 01)" };

  const product = await prisma.product.create({
    data: {
      sku,
      name,
      gtin,
      brand: String(formData.get("brand") || "").trim() || null,
      description: String(formData.get("description") || "").trim() || null,
      categoryId: String(formData.get("categoryId") || "").trim() || null,
      unitOfMeasure: String(formData.get("unitOfMeasure") || "pza").trim(),
      costPrice: parseFloat(String(formData.get("costPrice") || "0")) || 0,
      salePrice: parseFloat(String(formData.get("salePrice") || "0")) || 0,
      minStock: parseInt(String(formData.get("minStock") || "0"), 10) || 0,
      barcode: String(formData.get("barcode") || "").trim() || gtin,
    },
  });

  await logAudit({
    session,
    action: "CREATE",
    entityType: "Product",
    entityId: product.id,
    entityLabel: sku,
    summary: `Alta de producto ${sku} — ${name}`,
    changes: { sku, name, salePrice: product.salePrice, minStock: product.minStock },
  });

  revalidatePath("/products");
  return { success: true };
}

export async function updateProduct(id: string, formData: FormData) {
  const session = await requireProductWrite();

  const before = await prisma.product.findUnique({ where: { id } });
  if (!before) return { error: "Producto no encontrado" };

  const gtinRaw = String(formData.get("gtin") || "").trim();
  const gtin = gtinRaw ? normalizeGtin(gtinRaw) : null;
  if (gtin && !validateGtin(gtin)) return { error: "GTIN inválido (AI 01)" };

  const afterData = {
    sku: String(formData.get("sku") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    gtin,
    brand: String(formData.get("brand") || "").trim() || null,
    description: String(formData.get("description") || "").trim() || null,
    categoryId: String(formData.get("categoryId") || "").trim() || null,
    unitOfMeasure: String(formData.get("unitOfMeasure") || "pza").trim(),
    costPrice: parseFloat(String(formData.get("costPrice") || "0")) || 0,
    salePrice: parseFloat(String(formData.get("salePrice") || "0")) || 0,
    minStock: parseInt(String(formData.get("minStock") || "0"), 10) || 0,
    barcode: String(formData.get("barcode") || "").trim() || gtin,
    isActive: formData.get("isActive") === "on",
  };

  await prisma.product.update({ where: { id }, data: afterData });

  await logAudit({
    session,
    action: "UPDATE",
    entityType: "Product",
    entityId: id,
    entityLabel: afterData.sku,
    summary: `Modificó producto ${afterData.sku}`,
    changes: buildChanges(
      {
        sku: before.sku,
        name: before.name,
        salePrice: before.salePrice,
        costPrice: before.costPrice,
        minStock: before.minStock,
        isActive: before.isActive,
      },
      {
        sku: afterData.sku,
        name: afterData.name,
        salePrice: afterData.salePrice,
        costPrice: afterData.costPrice,
        minStock: afterData.minStock,
        isActive: afterData.isActive,
      }
    ),
  });

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return { success: true };
}

export async function getLots(search?: string) {
  return prisma.lot.findMany({
    where: search
      ? {
          OR: [
            { lotNumber: { contains: search, mode: "insensitive" } },
            { product: { name: { contains: search, mode: "insensitive" } } },
            { product: { sku: { contains: search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: { product: true, supplier: true },
    orderBy: { expirationDate: "asc" },
  });
}

export async function createLot(formData: FormData) {
  const session = await requireProductWrite();

  const productId = String(formData.get("productId") || "");
  const lotNumber = String(formData.get("lotNumber") || "").trim();
  const quantity = parseInt(String(formData.get("quantity") || "0"), 10);
  const supplierId = String(formData.get("supplierId") || "").trim() || null;

  if (!productId || !lotNumber) return { error: "Producto y lote son requeridos" };
  if (!validateLotNumber(lotNumber)) return { error: "Número de lote inválido (AI 10, max 20 chars)" };
  if (quantity < 0) return { error: "Cantidad inválida" };

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "Producto no encontrado" };

  const productionDate = formData.get("productionDate")
    ? parseAppDate(String(formData.get("productionDate")))
    : null;
  const expirationDate = formData.get("expirationDate")
    ? parseAppDate(String(formData.get("expirationDate")))
    : null;
  const bestBeforeDate = formData.get("bestBeforeDate")
    ? parseAppDate(String(formData.get("bestBeforeDate")))
    : null;

  const lot = await prisma.lot.create({
    data: {
      productId,
      lotNumber,
      serialNumber: String(formData.get("serialNumber") || "").trim() || null,
      productionDate,
      expirationDate,
      bestBeforeDate,
      quantity,
      location: String(formData.get("location") || "").trim() || null,
      supplierId,
    },
  });

  if (quantity > 0) {
    await prisma.stockMovement.create({
      data: {
        productId,
        lotId: lot.id,
        type: StockMovementType.IN,
        quantity,
        reference: "Entrada inicial",
      },
    });
  }

  await logAudit({
    session,
    action: "CREATE",
    entityType: "Lot",
    entityId: lot.id,
    entityLabel: `${product.sku} / ${lotNumber}`,
    summary: `Entrada de stock: ${quantity} pzas en lote ${lotNumber} (${product.sku})`,
    changes: { quantity, lotNumber, supplierId, location: lot.location },
  });

  revalidatePath("/lots");
  revalidatePath("/products");
  revalidatePath("/stock/history");
  return { success: true };
}

export async function receiveLotStock(lotId: string, formData: FormData) {
  const session = await requireProductWrite();

  const quantity = parseInt(String(formData.get("quantity") || "0"), 10);
  const reference = String(formData.get("reference") || "").trim() || "Recepción de mercancía";
  const notes = String(formData.get("notes") || "").trim() || null;

  if (quantity <= 0) return { error: "La cantidad debe ser mayor a cero" };

  const lot = await prisma.lot.findUnique({
    where: { id: lotId },
    include: { product: true },
  });
  if (!lot) return { error: "Lote no encontrado" };

  const qtyBefore = lot.quantity;

  await prisma.$transaction([
    prisma.lot.update({
      where: { id: lotId },
      data: { quantity: lot.quantity + quantity },
    }),
    prisma.stockMovement.create({
      data: {
        productId: lot.productId,
        lotId,
        type: StockMovementType.IN,
        quantity,
        reference,
        notes,
      },
    }),
  ]);

  await logAudit({
    session,
    action: "UPDATE",
    entityType: "Lot",
    entityId: lotId,
    entityLabel: `${lot.product.sku} / ${lot.lotNumber}`,
    summary: `Recibió ${quantity} pzas en lote ${lot.lotNumber} (${reference})`,
    changes: buildChanges(
      { quantity: qtyBefore },
      { quantity: qtyBefore + quantity },
      ["quantity"]
    ),
  });

  revalidatePath("/lots");
  revalidatePath(`/lots/${lotId}`);
  revalidatePath("/products");
  revalidatePath("/stock/history");
  return { success: true };
}

export async function adjustLotStock(lotId: string, formData: FormData) {
  const session = await requireProductWrite();

  const adjustment = parseInt(String(formData.get("adjustment") || "0"), 10);
  const notes = String(formData.get("notes") || "").trim();

  const lot = await prisma.lot.findUnique({
    where: { id: lotId },
    include: { product: true },
  });
  if (!lot) return { error: "Lote no encontrado" };

  const newQty = lot.quantity + adjustment;
  if (newQty < 0) return { error: "Stock insuficiente" };

  await prisma.$transaction([
    prisma.lot.update({ where: { id: lotId }, data: { quantity: newQty } }),
    prisma.stockMovement.create({
      data: {
        productId: lot.productId,
        lotId,
        type: StockMovementType.ADJUST,
        quantity: adjustment,
        notes,
        reference: "Ajuste manual",
      },
    }),
  ]);

  await logAudit({
    session,
    action: "UPDATE",
    entityType: "Lot",
    entityId: lotId,
    entityLabel: `${lot.product.sku} / ${lot.lotNumber}`,
    summary: `Ajuste de inventario ${adjustment >= 0 ? "+" : ""}${adjustment} en lote ${lot.lotNumber}`,
    changes: buildChanges(
      { quantity: lot.quantity },
      { quantity: newQty },
      ["quantity"]
    ),
  });

  revalidatePath("/lots");
  revalidatePath("/stock/history");
  return { success: true };
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { lots: { select: { quantity: true } } },
  });

  return products.filter((p) => {
    const total = p.lots.reduce((s, l) => s + l.quantity, 0);
    return total <= p.minStock;
  });
}

export async function getExpiringLots(days = 30) {
  const limit = new Date();
  limit.setDate(limit.getDate() + days);
  return prisma.lot.findMany({
    where: {
      expirationDate: { lte: limit, gte: new Date() },
      quantity: { gt: 0 },
    },
    include: { product: true },
    orderBy: { expirationDate: "asc" },
  });
}
