"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canWriteProducts } from "@/lib/permissions";
import { getSession } from "@/lib/auth";
import { validateGtin, normalizeGtin } from "@/lib/gs1";
import { logAudit } from "@/lib/audit";
import { findOrCreateCategoryByName } from "@/actions/categories";

export type ImportRowResult = {
  row: number;
  sku: string;
  status: "created" | "updated" | "error";
  message?: string;
};

async function requireProductWrite() {
  const session = await getSession();
  if (!session || !canWriteProducts(session.role)) {
    throw new Error("No autorizado");
  }
  return session;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function importProductsCsv(formData: FormData) {
  const session = await requireProductWrite();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Archivo CSV requerido" };

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 2) return { error: "El CSV debe tener encabezado y al menos una fila" };

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/^\ufeff/, ""));
  const skuIdx = header.indexOf("sku");
  const nameIdx = header.indexOf("name");

  if (skuIdx === -1 || nameIdx === -1) {
    return { error: "El CSV debe incluir columnas sku y name" };
  }

  const col = (key: string) => header.indexOf(key);
  const results: ImportRowResult[] = [];

  const categoryCache = new Map<string, string>();

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const cells = parseCsvLine(lines[i]);
    const sku = cells[skuIdx]?.trim();
    const name = cells[nameIdx]?.trim();

    if (!sku || !name) {
      results.push({ row: rowNum, sku: sku || "?", status: "error", message: "SKU y name requeridos" });
      continue;
    }

    const gtinRaw = col("gtin") >= 0 ? cells[col("gtin")]?.trim() : "";
    const gtin = gtinRaw ? normalizeGtin(gtinRaw) : null;
    if (gtin && !validateGtin(gtin)) {
      results.push({ row: rowNum, sku, status: "error", message: "GTIN inválido" });
      continue;
    }

    const categoryName = col("category") >= 0 ? cells[col("category")]?.trim() : "";
    let categoryId: string | null = null;
    if (categoryName) {
      const cacheKey = categoryName.toLowerCase();
      if (!categoryCache.has(cacheKey)) {
        categoryCache.set(cacheKey, await findOrCreateCategoryByName(categoryName));
      }
      categoryId = categoryCache.get(cacheKey) ?? null;
    }

    const data = {
      name,
      gtin,
      brand: col("brand") >= 0 ? cells[col("brand")]?.trim() || null : null,
      description: col("description") >= 0 ? cells[col("description")]?.trim() || null : null,
      categoryId,
      unitOfMeasure:
        col("unitofmeasure") >= 0 ? cells[col("unitofmeasure")]?.trim() || "pza" : "pza",
      costPrice: col("costprice") >= 0 ? parseFloat(cells[col("costprice")] || "0") || 0 : 0,
      salePrice: col("saleprice") >= 0 ? parseFloat(cells[col("saleprice")] || "0") || 0 : 0,
      minStock: col("minstock") >= 0 ? parseInt(cells[col("minstock")] || "0", 10) || 0 : 0,
      barcode: col("barcode") >= 0 ? cells[col("barcode")]?.trim() || gtin : gtin,
    };

    try {
      const existing = await prisma.product.findUnique({ where: { sku } });
      if (existing) {
        await prisma.product.update({ where: { sku }, data });
        results.push({ row: rowNum, sku, status: "updated" });
      } else {
        await prisma.product.create({ data: { sku, ...data } });
        results.push({ row: rowNum, sku, status: "created" });
      }
    } catch (e) {
      results.push({
        row: rowNum,
        sku,
        status: "error",
        message: e instanceof Error ? e.message : "Error desconocido",
      });
    }
  }

  revalidatePath("/products");
  revalidatePath("/categories");
  const summary = {
    created: results.filter((r) => r.status === "created").length,
    updated: results.filter((r) => r.status === "updated").length,
    errors: results.filter((r) => r.status === "error").length,
  };

  await logAudit({
    session,
    action: "IMPORT",
    entityType: "ImportBatch",
    entityLabel: file.name,
    summary: `Importación CSV: ${summary.created} creados, ${summary.updated} actualizados, ${summary.errors} errores`,
    changes: summary,
  });

  return { success: true, results, summary };
}

