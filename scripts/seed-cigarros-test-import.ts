/**
 * Idempotent seed: 8 productos CIGARROS + lotes con stock de prueba.
 *
 * Precios placeholder (MXN, no provistos en el origen):
 *   costPrice = 50, salePrice = 80
 *
 * El CSV de UI (`fixtures/cigarros-test-import.csv`) solo crea/actualiza
 * productos; este script también asegura lotes e inventario.
 *
 * Uso: npx tsx scripts/seed-cigarros-test-import.ts
 */
import { PrismaClient, StockMovementType } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

// Local Neon: prefer DIRECT_URL (non-pooler) to avoid idle disconnects / reachability issues.
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const prisma = new PrismaClient();

/** Stock por SKU (columna INVENTARIO del origen). */
const STOCK_BY_SKU: Record<string, number> = {
  "101001": 34,
  "101002": 30,
  "101003": 4,
  "101004": 325,
  "102001": 9,
  "102002": 13,
  "102003": 33,
  "102004": 44,
};

const LOT_PREFIX = "TEST-IMP";
const COST_PRICE = 50;
const SALE_PRICE = 80;

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

async function findOrCreateCategoryByName(name: string): Promise<string> {
  const trimmed = name.trim();
  const existing = await prisma.category.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) return existing.id;
  const created = await prisma.category.create({ data: { name: trimmed } });
  return created.id;
}

async function main() {
  const csvPath = resolve(process.cwd(), "fixtures/cigarros-test-import.csv");
  const text = readFileSync(csvPath, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 2) {
    throw new Error("CSV vacío o sin filas de datos");
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/^\ufeff/, ""));
  const skuIdx = header.indexOf("sku");
  const nameIdx = header.indexOf("name");
  if (skuIdx === -1 || nameIdx === -1) {
    throw new Error("El CSV debe incluir columnas sku y name");
  }

  const col = (key: string) => header.indexOf(key);
  const categoryCache = new Map<string, string>();

  let created = 0;
  let updated = 0;
  let lotsUpserted = 0;

  console.log("Precios placeholder MXN: costPrice=%d, salePrice=%d", COST_PRICE, SALE_PRICE);
  console.log("Fuente CSV:", csvPath);
  console.log("---");

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const sku = cells[skuIdx]?.trim();
    const name = cells[nameIdx]?.trim();
    if (!sku || !name) {
      console.warn(`Fila ${i + 1}: omitida (sku/name faltante)`);
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

    const brand = col("brand") >= 0 ? cells[col("brand")]?.trim() || null : null;
    const description =
      col("description") >= 0 ? cells[col("description")]?.trim() || null : null;
    const unitOfMeasure =
      col("unitofmeasure") >= 0 ? cells[col("unitofmeasure")]?.trim() || "pza" : "pza";
    const costPrice =
      col("costprice") >= 0 ? parseFloat(cells[col("costprice")] || "0") || COST_PRICE : COST_PRICE;
    const salePrice =
      col("saleprice") >= 0 ? parseFloat(cells[col("saleprice")] || "0") || SALE_PRICE : SALE_PRICE;
    const minStock =
      col("minstock") >= 0 ? parseInt(cells[col("minstock")] || "0", 10) || 0 : 0;

    const data = {
      name,
      brand,
      description,
      categoryId,
      unitOfMeasure,
      costPrice,
      salePrice,
      minStock,
    };

    const existing = await prisma.product.findUnique({ where: { sku } });
    let productId: string;

    if (existing) {
      await prisma.product.update({ where: { sku }, data });
      productId = existing.id;
      updated++;
      console.log(`UPDATED product ${sku} — ${name}`);
    } else {
      const createdProduct = await prisma.product.create({ data: { sku, ...data } });
      productId = createdProduct.id;
      created++;
      console.log(`CREATED product ${sku} — ${name}`);
    }

    const qty = STOCK_BY_SKU[sku];
    if (qty === undefined) {
      console.warn(`  Sin stock mapeado para SKU ${sku}; lote omitido`);
      continue;
    }

    const lotNumber = `${LOT_PREFIX}-${sku}`;
    const existingLot = await prisma.lot.findUnique({
      where: { productId_lotNumber: { productId, lotNumber } },
    });

    if (existingLot) {
      const prevQty = existingLot.quantity;
      if (prevQty !== qty) {
        await prisma.lot.update({
          where: { id: existingLot.id },
          data: { quantity: qty },
        });
        const delta = qty - prevQty;
        if (delta !== 0) {
          await prisma.stockMovement.create({
            data: {
              productId,
              lotId: existingLot.id,
              type: delta > 0 ? StockMovementType.IN : StockMovementType.OUT,
              quantity: Math.abs(delta),
              reference: "Ajuste seed cigarros test import",
            },
          });
        }
        console.log(`  UPDATED lot ${lotNumber}: ${prevQty} → ${qty}`);
      } else {
        console.log(`  OK lot ${lotNumber}: qty=${qty}`);
      }
    } else {
      const lot = await prisma.lot.create({
        data: {
          productId,
          lotNumber,
          quantity: qty,
          location: "Importación prueba",
        },
      });
      if (qty > 0) {
        await prisma.stockMovement.create({
          data: {
            productId,
            lotId: lot.id,
            type: StockMovementType.IN,
            quantity: qty,
            reference: "Entrada inicial seed cigarros test import",
          },
        });
      }
      console.log(`  CREATED lot ${lotNumber}: qty=${qty}`);
    }
    lotsUpserted++;
  }

  const skus = Object.keys(STOCK_BY_SKU);
  const products = await prisma.product.findMany({
    where: { sku: { in: skus } },
    include: {
      category: { select: { name: true } },
      lots: { where: { lotNumber: { startsWith: LOT_PREFIX } }, select: { lotNumber: true, quantity: true } },
    },
    orderBy: { sku: "asc" },
  });

  console.log("---");
  console.log(`Resumen: ${created} creados, ${updated} actualizados, ${lotsUpserted} lotes`);
  console.log(`Verificación DB: ${products.length}/${skus.length} productos encontrados`);
  for (const p of products) {
    const stock = p.lots.reduce((s, l) => s + l.quantity, 0);
    console.log(
      `  ${p.sku} | ${p.name} | cat=${p.category?.name ?? "-"} | stock=${stock} | cost=${p.costPrice} sale=${p.salePrice}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
